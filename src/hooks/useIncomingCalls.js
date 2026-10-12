import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import getPortalSupabaseClient from "../services/getPortalSupabaseClient";

export default function useIncomingCalls() {
  const location = useLocation();

  const client = useMemo(
    () => getPortalSupabaseClient(location.pathname),
    [location.pathname]
  );

  const [incomingCall, setIncomingCall] = useState(null);
  const [loading, setLoading] = useState(false);

  const incomingCallRef = useRef(null);
  const channelRef = useRef(null);
  const mountedRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const generationRef = useRef(0);
  const clientRef = useRef(client);

  // Keep the latest client available to callbacks and cleanup.
  clientRef.current = client;

  const publishIncomingCall = useCallback((call) => {
    incomingCallRef.current = call;

    if (mountedRef.current) {
      setIncomingCall(call);
    }
  }, []);

  // =========================================================
  // GET CURRENT USER
  // =========================================================

  const loadCurrentUser = useCallback(async () => {
    const activeClient = clientRef.current;

    const {
      data: { session },
      error,
    } = await activeClient.auth.getSession();

    if (error) {
      console.error("[Incoming Calls] Session lookup failed:", error);
      return null;
    }

    const userId = session?.user?.id ?? null;
    currentUserIdRef.current = userId;

    return userId;
  }, []);

  // =========================================================
  // LOAD AND VALIDATE A CALL
  // =========================================================

  const loadCall = useCallback(async (callId) => {
    if (!callId) return null;

    const activeClient = clientRef.current;

    const { data, error } = await activeClient.rpc("get_call_details", {
      p_call_id: callId,
    });

    if (error) {
      console.error("[Incoming Calls] Failed to load call details:", error);
      return null;
    }

    if (!data || data.status !== "ringing") {
      return null;
    }

    const currentUserId = currentUserIdRef.current;

    if (!currentUserId || data.caller_id === currentUserId) {
      return null;
    }

    return data;
  }, []);

  // =========================================================
  // PROCESS A POSSIBLE INCOMING CALL
  // =========================================================

  const processCall = useCallback(
    async (callId, expectedGeneration = generationRef.current) => {
      if (!callId || !currentUserIdRef.current) return;

      const call = await loadCall(callId);

      if (!mountedRef.current || expectedGeneration !== generationRef.current) {
        return;
      }

      if (!call) {
        if (incomingCallRef.current?.id === callId) {
          publishIncomingCall(null);
        }
        return;
      }

      // Avoid replacing an already-visible incoming call with another.
      const current = incomingCallRef.current;

      if (current && current.id !== callId) {
        return;
      }

      publishIncomingCall(call);
    },
    [loadCall, publishIncomingCall]
  );

  // =========================================================
  // HANDLE INSERT / UPDATE
  // =========================================================

  const handleNewCall = useCallback(
    (payload) => {
      const newCall = payload?.new;

      if (!newCall?.id) return;
      if (newCall.caller_id === currentUserIdRef.current) return;

      void processCall(newCall.id);
    },
    [processCall]
  );

  const handleCallUpdate = useCallback(
    (payload) => {
      const updatedCall = payload?.new;
      const callId = updatedCall?.id;

      if (!callId) return;

      if (updatedCall.status !== "ringing") {
        if (incomingCallRef.current?.id === callId) {
          publishIncomingCall(null);
        }
        return;
      }

      if (updatedCall.caller_id !== currentUserIdRef.current) {
        void processCall(callId);
      }
    },
    [processCall, publishIncomingCall]
  );

  // =========================================================
  // RECOVER RINGING CALLS
  // =========================================================

  const recoverIncomingCalls = useCallback(
    async (expectedGeneration) => {
      const userId = currentUserIdRef.current;

      if (!userId || incomingCallRef.current) return;

      if (mountedRef.current) {
        setLoading(true);
      }

      try {
        const activeClient = clientRef.current;

        const { data, error } = await activeClient
          .from("calls")
          .select("id, caller_id")
          .eq("status", "ringing")
          .neq("caller_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.warn(
            "[Incoming Calls] Recovery query unavailable:",
            error.message
          );
          return;
        }

        if (
          !mountedRef.current ||
          expectedGeneration !== generationRef.current
        ) {
          return;
        }

        for (const candidate of data || []) {
          if (incomingCallRef.current) break;

          await processCall(candidate.id, expectedGeneration);

          if (
            !mountedRef.current ||
            expectedGeneration !== generationRef.current
          ) {
            return;
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [processCall]
  );

  // =========================================================
  // SUBSCRIBE TO INCOMING CALLS
  // =========================================================

  useEffect(() => {
    let disposed = false;
    let localChannel = null;

    mountedRef.current = true;

    const activeClient = client;

    const removeCurrentChannel = async () => {
      const channel = localChannel;
      localChannel = null;

      if (channelRef.current === channel) {
        channelRef.current = null;
      }

      if (channel) {
        try {
          await activeClient.removeChannel(channel);
        } catch (error) {
          console.warn("[Incoming Calls] Channel cleanup failed:", error);
        }
      }
    };

    const setup = async () => {
      const userId = await loadCurrentUser();

      if (disposed || !mountedRef.current || !userId) {
        if (!userId) {
          publishIncomingCall(null);
        }
        return;
      }

      if (localChannel || channelRef.current) return;

      const generation = ++generationRef.current;

      const channel = activeClient
        .channel(`incoming-calls:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "calls",
          },
          handleNewCall
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "calls",
          },
          handleCallUpdate
        );

      localChannel = channel;
      channelRef.current = channel;

      channel.subscribe((status, error) => {
        if (disposed || generation !== generationRef.current) return;

        console.log("[Incoming Calls] Realtime status:", status);

        if (status === "SUBSCRIBED") {
          void recoverIncomingCalls(generation);
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            "[Incoming Calls] Subscription problem:",
            error || status
          );
        }

        if (status === "CLOSED" && channelRef.current === channel) {
          channelRef.current = null;
          localChannel = null;
        }
      });
    };

    void setup().catch((error) => {
      console.error("[Incoming Calls] Setup failed:", error);
    });

    const {
      data: { subscription },
    } = activeClient.auth.onAuthStateChange((event, session) => {
      if (disposed) return;

      if (event === "SIGNED_IN" && session?.user) {
        currentUserIdRef.current = session.user.id;
        void setup();
        return;
      }

      if (event === "SIGNED_OUT") {
        generationRef.current += 1;
        currentUserIdRef.current = null;
        publishIncomingCall(null);
        void removeCurrentChannel();
      }
    });

    return () => {
      disposed = true;
      mountedRef.current = false;
      generationRef.current += 1;

      subscription?.unsubscribe();
      void removeCurrentChannel();
    };
  }, [
    client,
    loadCurrentUser,
    handleNewCall,
    handleCallUpdate,
    recoverIncomingCalls,
    publishIncomingCall,
  ]);

  // =========================================================
  // CLEAR INCOMING CALL
  // =========================================================

  const clearIncomingCall = useCallback(() => {
    publishIncomingCall(null);
  }, [publishIncomingCall]);

  return {
    incomingCall,
    loading,
    clearIncomingCall,
  };
}
