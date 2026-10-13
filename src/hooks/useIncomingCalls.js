import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import getPortalSupabaseClient from "../services/getPortalSupabaseClient";

const PROFILE_PHOTO_BUCKET = "profile-photos";
const COMPANY_LOGO_BUCKET = "company-logos";

/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function normalizeStoragePath(path, bucketName, stripBucketPrefix = false) {
  if (!path || typeof path !== "string") return "";

  let cleanPath = path.trim();

  // Extract the object path if the database already stores a URL.
  const markers = [
    `/storage/v1/object/public/${bucketName}/`,
    `/storage/v1/object/sign/${bucketName}/`,
    `/storage/v1/object/authenticated/${bucketName}/`,
  ];

  for (const marker of markers) {
    const index = cleanPath.indexOf(marker);

    if (index !== -1) {
      cleanPath = cleanPath.slice(index + marker.length).split("?")[0];
      break;
    }
  }

  cleanPath = cleanPath.replace(/^\/+/, "");

  // Only strip a bucket prefix when explicitly requested.
  if (stripBucketPrefix && cleanPath.startsWith(`${bucketName}/`)) {
    cleanPath = cleanPath.slice(bucketName.length + 1);
  }

  return cleanPath;
}

function resolveProfilePhoto(client, photoPath) {
  if (!photoPath || typeof photoPath !== "string") {
    return { url: null, fallbackUrl: null };
  }

  if (/^https?:\/\//i.test(photoPath)) {
    return { url: photoPath, fallbackUrl: null };
  }

  // Try the exact object path stored in the database first.
  const exactPath = normalizeStoragePath(
    photoPath,
    PROFILE_PHOTO_BUCKET,
    false
  );

  if (!exactPath) {
    return { url: null, fallbackUrl: null };
  }

  const { data } = client.storage
    .from(PROFILE_PHOTO_BUCKET)
    .getPublicUrl(exactPath);

  let fallbackUrl = null;

  // If the stored path starts with the bucket name, prepare an
  // alternate URL for legacy records using a relative object path.
  if (exactPath.startsWith(`${PROFILE_PHOTO_BUCKET}/`)) {
    const alternatePath = normalizeStoragePath(
      exactPath,
      PROFILE_PHOTO_BUCKET,
      true
    );

    const { data: alternateData } = client.storage
      .from(PROFILE_PHOTO_BUCKET)
      .getPublicUrl(alternatePath);

    if (alternateData?.publicUrl !== data?.publicUrl) {
      fallbackUrl = alternateData?.publicUrl ?? null;
    }
  }

  return {
    url: data?.publicUrl ?? null,
    fallbackUrl,
  };
}

async function resolveCompanyLogo(client, logoPath) {
  if (!logoPath || typeof logoPath !== "string") {
    return { url: null, fallbackUrl: null };
  }

  if (/^https?:\/\//i.test(logoPath)) {
    return { url: logoPath, fallbackUrl: null };
  }

  const exactPath = normalizeStoragePath(logoPath, COMPANY_LOGO_BUCKET, false);

  if (!exactPath) {
    return { url: null, fallbackUrl: null };
  }

  // Company logos are in a private bucket, so use signed URLs.
  const exactResult = await client.storage
    .from(COMPANY_LOGO_BUCKET)
    .createSignedUrl(exactPath, 3600);

  if (!exactResult.error && exactResult.data?.signedUrl) {
    return {
      url: exactResult.data.signedUrl,
      fallbackUrl: null,
    };
  }

  // Fallback for paths that include "company-logos/" even though
  // the stored object may be relative to the bucket.
  if (exactPath.startsWith(`${COMPANY_LOGO_BUCKET}/`)) {
    const alternatePath = normalizeStoragePath(
      exactPath,
      COMPANY_LOGO_BUCKET,
      true
    );

    const alternateResult = await client.storage
      .from(COMPANY_LOGO_BUCKET)
      .createSignedUrl(alternatePath, 3600);

    if (!alternateResult.error && alternateResult.data?.signedUrl) {
      return {
        url: alternateResult.data.signedUrl,
        fallbackUrl: null,
      };
    }
  }

  console.warn(
    "[Incoming Calls] Could not resolve company logo:",
    exactResult.error?.message
  );

  return { url: null, fallbackUrl: null };
}

/* =========================================================
   ENRICH CALL WITH CALLER DETAILS
   ========================================================= */

async function enrichCallerDetails(client, call) {
  const { data, error } = await client.rpc("get_call_caller_details", {
    p_call_id: call.id,
  });

  if (error) {
    console.error("[Incoming Calls] Caller details RPC failed:", error.message);

    return {
      ...call,
      caller_name: "Unknown caller",
      caller_photo_url: null,
      caller_photo_fallback_url: null,
      caller: null,
    };
  }

  const details = Array.isArray(data) ? data[0] : data;

  if (!details) {
    return {
      ...call,
      caller_name: "Unknown caller",
      caller_photo_url: null,
      caller_photo_fallback_url: null,
      caller: null,
    };
  }

  const normalizedRole = String(details.caller_role || "")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  const isCompany = ["company", "company supervisor"].includes(normalizedRole);

  const rawPhoto = details.caller_photo_url;

  console.log("[Incoming Calls] Caller details:", {
    callerId: details.caller_id,
    callerName: details.caller_name,
    callerRole: details.caller_role,
    rawPhoto,
  });

  let photoUrl = null;
  let photoFallbackUrl = null;

  if (isCompany) {
    const result = await resolveCompanyLogo(client, rawPhoto);
    photoUrl = result.url;
    photoFallbackUrl = result.fallbackUrl;
  } else {
    const result = resolveProfilePhoto(client, rawPhoto);
    photoUrl = result.url;
    photoFallbackUrl = result.fallbackUrl;
  }

  console.log("[Incoming Calls] Resolved caller image:", {
    callerName: details.caller_name,
    callerRole: details.caller_role,
    isCompany,
    photoUrl,
    photoFallbackUrl,
  });

  const callerName = details.caller_name || "Unknown caller";

  return {
    ...call,
    caller_name: callerName,
    caller_photo_url: photoUrl,
    caller_photo_fallback_url: photoFallbackUrl,
    caller: {
      id: details.caller_id,
      full_name: callerName,
      name: callerName,
      role: details.caller_role,
      profile_photo_url: photoUrl,
      photo_url: photoUrl,
      avatar_url: photoUrl,
    },
  };
}

/* =========================================================
   INCOMING CALLS HOOK
   ========================================================= */

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

  clientRef.current = client;

  const publishIncomingCall = useCallback((call) => {
    incomingCallRef.current = call;

    if (mountedRef.current) {
      setIncomingCall(call);
    }
  }, []);

  /* =========================================================
     GET CURRENT USER
     ========================================================= */

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

  /* =========================================================
     LOAD AND VALIDATE CALL
     ========================================================= */

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

    return enrichCallerDetails(activeClient, data);
  }, []);

  /* =========================================================
     PROCESS INCOMING CALL
     ========================================================= */

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

      const current = incomingCallRef.current;

      if (current && current.id !== callId) {
        return;
      }

      publishIncomingCall(call);
    },
    [loadCall, publishIncomingCall]
  );

  /* =========================================================
     HANDLE NEW CALL
     ========================================================= */

  const handleNewCall = useCallback(
    (payload) => {
      const newCall = payload?.new;

      if (!newCall?.id) return;
      if (newCall.caller_id === currentUserIdRef.current) return;

      void processCall(newCall.id);
    },
    [processCall]
  );

  /* =========================================================
     HANDLE CALL UPDATE
     ========================================================= */

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

  /* =========================================================
     RECOVER RINGING CALLS
     ========================================================= */

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

  /* =========================================================
     SUBSCRIBE TO INCOMING CALLS
     ========================================================= */

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

  /* =========================================================
     CLEAR INCOMING CALL
     ========================================================= */

  const clearIncomingCall = useCallback(() => {
    publishIncomingCall(null);
  }, [publishIncomingCall]);

  return {
    incomingCall,
    loading,
    clearIncomingCall,
  };
}
