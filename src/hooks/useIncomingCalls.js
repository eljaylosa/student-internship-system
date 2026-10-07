import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseStudent } from "../supabaseClient";

export default function useIncomingCalls() {
  const [incomingCall, setIncomingCall] = useState(null);
  const [loading, setLoading] = useState(false);

  const channelRef = useRef(null);
  const mountedRef = useRef(true);
  const currentUserIdRef = useRef(null);

  // =========================================================
  // GET CURRENT USER
  // =========================================================

  const loadCurrentUser = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabaseStudent.auth.getSession();

      if (sessionError) {
        console.error(
          "Failed to get auth session for incoming calls:",
          sessionError
        );

        return null;
      }

      if (!session?.user) {
        currentUserIdRef.current = null;
        return null;
      }

      currentUserIdRef.current = session.user.id;

      return session.user.id;
    } catch (error) {
      console.error("Incoming call session lookup error:", error);

      return null;
    }
  }, []);

  // =========================================================
  // LOAD CALL
  // =========================================================

  const loadCall = useCallback(async (callId) => {
    if (!callId) {
      return null;
    }

    try {
      const { data, error } = await supabaseStudent.rpc("get_call_details", {
        p_call_id: callId,
      });

      if (error) {
        console.error("Failed to load incoming call:", error);

        return null;
      }

      if (!data) {
        return null;
      }

      if (data.status !== "ringing") {
        return null;
      }

      return data;
    } catch (error) {
      console.error("Incoming call load error:", error);

      return null;
    }
  }, []);

  // =========================================================
  // HANDLE NEW CALL
  // =========================================================

  const handleNewCall = useCallback(
    async (payload) => {
      const callId = payload?.new?.id;

      if (!callId) {
        return;
      }

      const currentUserId = currentUserIdRef.current;

      const callerId = payload?.new?.caller_id;

      // -----------------------------------------------------
      // Ignore our own outgoing calls.
      // -----------------------------------------------------

      if (currentUserId && callerId === currentUserId) {
        return;
      }

      setLoading(true);

      const call = await loadCall(callId);

      if (!mountedRef.current) {
        return;
      }

      if (!call) {
        setLoading(false);
        return;
      }

      // -----------------------------------------------------
      // Double-check caller.
      // -----------------------------------------------------

      if (currentUserId && call.caller_id === currentUserId) {
        setLoading(false);
        return;
      }

      setIncomingCall(call);
      setLoading(false);
    },
    [loadCall]
  );

  // =========================================================
  // HANDLE CALL UPDATE
  // =========================================================

  const handleCallUpdate = useCallback((payload) => {
    const callId = payload?.new?.id;

    if (!callId) {
      return;
    }

    if (payload?.new?.status !== "ringing") {
      setIncomingCall((current) => (current?.id === callId ? null : current));
    }
  }, []);

  // =========================================================
  // SUBSCRIBE TO INCOMING CALLS
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    const setup = async () => {
      const userId = await loadCurrentUser();

      // -----------------------------------------------------
      // No authenticated user.
      //
      // This is normal on login/register pages.
      // -----------------------------------------------------

      if (!userId || cancelled) {
        return;
      }

      // -----------------------------------------------------
      // Make sure an old channel doesn't remain.
      // -----------------------------------------------------

      if (channelRef.current) {
        await supabaseStudent.removeChannel(channelRef.current);

        channelRef.current = null;
      }

      // -----------------------------------------------------
      // IMPORTANT:
      // Register ALL listeners BEFORE subscribe().
      // -----------------------------------------------------

      const channel = supabaseStudent
        .channel("incoming-calls")
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

      channelRef.current = channel;

      channel.subscribe((status) => {
        console.log("[Incoming Calls] Realtime status:", status);
      });
    };

    setup();

    // -------------------------------------------------------
    // React to login/logout without requiring a page reload.
    // -------------------------------------------------------

    const { data: authListener } = supabaseStudent.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) {
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          currentUserIdRef.current = session.user.id;

          // If there is no channel yet, create one.
          if (!channelRef.current) {
            await setup();
          }

          return;
        }

        if (event === "SIGNED_OUT") {
          currentUserIdRef.current = null;

          setIncomingCall(null);

          if (channelRef.current) {
            await supabaseStudent.removeChannel(channelRef.current);

            channelRef.current = null;
          }
        }
      }
    );

    return () => {
      cancelled = true;
      mountedRef.current = false;

      authListener?.subscription?.unsubscribe();

      if (channelRef.current) {
        supabaseStudent.removeChannel(channelRef.current);

        channelRef.current = null;
      }
    };
  }, [handleCallUpdate, handleNewCall, loadCurrentUser]);

  // =========================================================
  // CLEAR INCOMING CALL
  // =========================================================

  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return {
    incomingCall,
    loading,
    clearIncomingCall,
  };
}
