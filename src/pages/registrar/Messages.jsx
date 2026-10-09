import React, { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

const MESSAGE_ATTACHMENT_BUCKET = "message-attachments";
const ATTACHMENT_URL_EXPIRY = 60 * 60;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const Messages = () => {
  const { darkMode } = useOutletContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [conversations, setConversations] = useState({});
  const [unreadByContact, setUnreadByContact] = useState({});
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [messageActionError, setMessageActionError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [reactionBusyId, setReactionBusyId] = useState(null);

  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesRefForSync = useRef(messages);
  const contactsRef = useRef(contacts);
  const selectedContactRef = useRef(selectedContact);
  const unreadRefreshVersionRef = useRef(0);

  useEffect(() => {
    messagesRefForSync.current = messages;
  }, [messages]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";
  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";
  const mainContainerClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";
  const panelClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";
  const chatClass = darkMode ? "bg-slate-900" : "bg-white";
  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:bg-slate-900 focus:border-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-700";

  const getContactClass = (active) =>
    active
      ? darkMode
        ? "bg-slate-700 border-slate-600 text-white shadow-sm"
        : "bg-slate-800 border-slate-800 text-white shadow-sm"
      : darkMode
      ? "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600"
      : "bg-white border-slate-200 text-slate-900 hover:bg-slate-100 hover:border-slate-400";

  const getAvatarClass = (active) =>
    active
      ? darkMode
        ? "bg-slate-600 text-slate-100"
        : "bg-white/15 text-white"
      : darkMode
      ? "bg-slate-700 text-slate-300"
      : "bg-slate-200 text-slate-600";

  const buildName = (user) =>
    [user?.first_name, user?.middle_name, user?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

  const getInitials = (name) =>
    !name
      ? "?"
      : name
          .split(" ")
          .filter(Boolean)
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  const getProfilePhotoUrl = (storedPath) => {
    if (!storedPath) return null;
    const normalizedPath = storedPath.startsWith("profile-photos/")
      ? storedPath
      : `profile-photos/${storedPath}`;

    const { data } = supabaseRegistrar.storage
      .from("profile-photos")
      .getPublicUrl(normalizedPath);

    return data?.publicUrl || null;
  };

  const normalizeMessage = useCallback(
    (message) => {
      if (!message) return null;

      return {
        ...message,
        id: message.id,
        sender: message.sender_id === currentUser?.id ? "sent" : "received",
        text: message.content || "",
        status:
          message.sender_id === currentUser?.id
            ? message.status ||
              (message.seen_at || message.seenAt
                ? "seen"
                : message.delivered_at || message.deliveredAt
                ? "delivered"
                : "sent")
            : null,
        deliveredAt: message.delivered_at || message.deliveredAt || null,
        seenAt: message.seen_at || message.seenAt || null,
        attachments: message.attachments || [],
        reactions: message.reactions || [],
        isDeleted: Boolean(message.is_deleted || message.deleted_at),
        editedAt: message.edited_at || null,
        time: message.created_at
          ? new Date(message.created_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : "",
      };
    },
    [currentUser?.id]
  );

  // =========================================================
  // MESSAGE DELIVERY / READ RECEIPTS
  // =========================================================

  const markMessageDelivered = async (messageId) => {
    if (!messageId || !currentUser?.id) return;

    try {
      const { error } = await supabaseRegistrar.rpc("mark_message_delivered", {
        p_message_id: messageId,
      });

      if (error) {
        console.warn(
          "[Registrar Messages] Could not mark message delivered:",
          error.message
        );
      }
    } catch (error) {
      console.warn("[Registrar Messages] Delivery receipt failed:", error);
    }
  };

  const markConversationSeen = async (conversationId, latestMessageId) => {
    if (!conversationId || !latestMessageId || !currentUser?.id) return;

    try {
      const { error } = await supabaseRegistrar.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
        p_message_id: latestMessageId,
      });

      if (error) {
        console.warn(
          "[Registrar Messages] Could not mark conversation seen:",
          error.message
        );
      }
    } catch (error) {
      console.warn("[Registrar Messages] Read receipt failed:", error);
    }
  };

  const refreshOutgoingMessageStatuses = async (conversationId, contactId) => {
    if (!conversationId || !contactId || !currentUser?.id) return;

    try {
      const { data, error } = await supabaseRegistrar.rpc(
        "get_outgoing_message_statuses",
        { p_conversation_id: conversationId }
      );

      if (error) {
        console.warn(
          "[Registrar Messages] Could not refresh delivery statuses:",
          error.message
        );
        return;
      }

      const statusByMessageId = new Map(
        (data || []).map((row) => [
          row.message_id,
          row.seen_at
            ? {
                status: "seen",
                deliveredAt: row.delivered_at || null,
                seenAt: row.seen_at,
              }
            : row.delivered_at
            ? {
                status: "delivered",
                deliveredAt: row.delivered_at,
                seenAt: null,
              }
            : {
                status: "sent",
                deliveredAt: null,
                seenAt: null,
              },
        ])
      );

      const rank = { sent: 0, delivered: 1, seen: 2 };

      setMessages((previous) => ({
        ...previous,
        [contactId]: (previous[contactId] || []).map((message) => {
          if (
            message.sender_id !== currentUser.id ||
            !statusByMessageId.has(message.id)
          ) {
            return message;
          }

          const fetched = statusByMessageId.get(message.id);
          const currentStatus = message.status || "sent";
          const nextStatus =
            (rank[currentStatus] ?? 0) > (rank[fetched.status] ?? 0)
              ? currentStatus
              : fetched.status;

          return {
            ...message,
            status: nextStatus,
            deliveredAt: message.deliveredAt || fetched.deliveredAt || null,
            seenAt: message.seenAt || fetched.seenAt || null,
          };
        }),
      }));
    } catch (error) {
      console.warn("[Registrar Messages] Status refresh failed:", error);
    }
  };

  // =========================================================
  // UNREAD MESSAGE COUNTS
  // Rebuild counts from the database instead of relying on
  // Realtime events alone, so missed events can be recovered.
  // =========================================================

  const refreshUnreadCounts = useCallback(async () => {
    if (!currentUser?.id || contactsLoading) return;

    const refreshVersion = ++unreadRefreshVersionRef.current;

    try {
      const { data: memberships, error: membershipError } =
        await supabaseRegistrar
          .from("conversation_members")
          .select("conversation_id, joined_at")
          .eq("user_id", currentUser.id);

      if (membershipError) throw membershipError;

      const membershipByConversation = new Map(
        (memberships || []).map((row) => [row.conversation_id, row.joined_at])
      );

      const conversationIds = [...membershipByConversation.keys()];

      if (!conversationIds.length) {
        if (refreshVersion === unreadRefreshVersionRef.current) {
          setUnreadByContact({});
        }
        return;
      }

      const [
        { data: memberRows, error: memberError },
        { data: messageRows, error: messageError },
        { data: readRows, error: readError },
      ] = await Promise.all([
        supabaseRegistrar
          .from("conversation_members")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds),

        supabaseRegistrar
          .from("messages")
          .select(
            "id, conversation_id, sender_id, created_at, is_deleted, deleted_at"
          )
          .in("conversation_id", conversationIds)
          .neq("sender_id", currentUser.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true }),

        supabaseRegistrar
          .from("message_reads")
          .select("conversation_id, last_read_at")
          .eq("user_id", currentUser.id)
          .in("conversation_id", conversationIds),
      ]);

      if (memberError) throw memberError;
      if (messageError) throw messageError;
      if (readError) throw readError;

      if (refreshVersion !== unreadRefreshVersionRef.current) return;

      const allowedContactIds = new Set(
        contactsRef.current.map((contact) => contact.id)
      );

      const contactByConversation = new Map();

      for (const member of memberRows || []) {
        if (member.user_id === currentUser.id) continue;
        if (!allowedContactIds.has(member.user_id)) continue;

        contactByConversation.set(member.conversation_id, member.user_id);
      }

      const readAtByConversation = new Map(
        (readRows || []).map((row) => [
          row.conversation_id,
          row.last_read_at ? new Date(row.last_read_at).getTime() : 0,
        ])
      );

      const openContactId = selectedContactRef.current?.id;
      const nextUnreadCounts = {};

      for (const message of messageRows || []) {
        if (!message.created_at) continue;

        const contactId = contactByConversation.get(message.conversation_id);

        if (!contactId) continue;
        if (contactId === openContactId) continue;

        const joinedAt = membershipByConversation.get(message.conversation_id);

        // Do not count messages sent before this member joined.
        if (
          joinedAt &&
          new Date(message.created_at).getTime() < new Date(joinedAt).getTime()
        ) {
          continue;
        }

        const lastReadAt =
          readAtByConversation.get(message.conversation_id) || 0;

        if (new Date(message.created_at).getTime() <= lastReadAt) {
          continue;
        }

        nextUnreadCounts[contactId] = (nextUnreadCounts[contactId] || 0) + 1;
      }

      if (refreshVersion === unreadRefreshVersionRef.current) {
        setUnreadByContact(nextUnreadCounts);
      }
    } catch (error) {
      console.error(
        "[Registrar Messages] Failed to refresh unread counts:",
        error
      );
    }
  }, [currentUser?.id, contactsLoading]);

  useEffect(() => {
    if (!currentUser?.id || contactsLoading) return undefined;

    let mounted = true;

    const refresh = () => {
      if (mounted) void refreshUnreadCounts();
    };

    refresh();

    const messagesChannel = supabaseRegistrar
      .channel(`registrar-unread-messages-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (!mounted) return;

          const incoming = payload?.new;

          if (incoming?.id && incoming.sender_id !== currentUser.id) {
            void markMessageDelivered(incoming.id);
          }

          refresh();
        }
      )
      .subscribe((status) => {
        console.log("[Registrar Messages] Unread realtime status:", status);
      });

    const readsChannel = supabaseRegistrar
      .channel(`registrar-unread-reads-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reads",
          filter: `user_id=eq.${currentUser.id}`,
        },
        refresh
      )
      .subscribe();

    // Recovery if Realtime misses an event.
    const pollTimer = setInterval(refresh, 5000);

    return () => {
      mounted = false;
      unreadRefreshVersionRef.current += 1;
      clearInterval(pollTimer);
      void supabaseRegistrar.removeChannel(messagesChannel);
      void supabaseRegistrar.removeChannel(readsChannel);
    };
  }, [currentUser?.id, contactsLoading, refreshUnreadCounts]);

  // =========================================================
  // ATTACHMENTS
  // =========================================================

  const loadAttachmentsForMessages = useCallback(async (messageRows) => {
    const messageIds = (messageRows || [])
      .map((message) => message.id)
      .filter(Boolean);

    if (!messageIds.length) return {};

    const { data: rows, error } = await supabaseRegistrar
      .from("message_attachments")
      .select(
        "id, message_id, file_name, file_path, file_type, file_size, created_at"
      )
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "[Registrar Messages] Failed to load attachment metadata:",
        error
      );
      throw error;
    }

    const map = {};

    await Promise.all(
      (rows || []).map(async (row) => {
        if (!map[row.message_id]) map[row.message_id] = [];

        const { data, error: urlError } = await supabaseRegistrar.storage
          .from(MESSAGE_ATTACHMENT_BUCKET)
          .createSignedUrl(row.file_path, ATTACHMENT_URL_EXPIRY);

        if (urlError) {
          console.error(
            "[Registrar Messages] Failed to create attachment URL:",
            row.file_name,
            urlError
          );
        }

        map[row.message_id].push({
          id: row.id,
          fileName: row.file_name,
          filePath: row.file_path,
          fileType: row.file_type || "application/octet-stream",
          fileSize: Number(row.file_size) || 0,
          createdAt: row.created_at,
          url: data?.signedUrl || null,
        });
      })
    );

    return map;
  }, []);

  // =========================================================
  // CURRENT USER
  // =========================================================

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseRegistrar.auth.getUser();

        if (error) throw error;
        if (mounted) setCurrentUser(user || null);
      } catch (error) {
        console.error(
          "[Registrar Messages] Failed to load current user:",
          error
        );
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // CONTACTS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    (async () => {
      setContactsLoading(true);

      try {
        const { data, error } = await supabaseRegistrar.rpc(
          "get_registrar_message_contacts"
        );

        if (error) throw error;

        const ids = (data || []).map((person) => person.id).filter(Boolean);

        let profileMap = {};

        if (ids.length) {
          const { data: profiles, error: profileError } =
            await supabaseRegistrar
              .from("students")
              .select("id, profile_photo_url")
              .in("id", ids);

          if (profileError) {
            console.error(
              "[Registrar Messages] Profile photo query error:",
              profileError
            );
          } else {
            profileMap = (profiles || []).reduce((map, profile) => {
              map[profile.id] = profile.profile_photo_url || null;
              return map;
            }, {});
          }
        }

        const formatted = (data || []).map((person) => ({
          id: person.id,
          name: buildName(person) || "Unnamed User",
          role:
            person.contact_type === "student"
              ? "Student"
              : person.role || "User",
          unread: 0,
          contactType: person.contact_type || "student",
          status: person.status,
          profilePhotoUrl: getProfilePhotoUrl(profileMap[person.id]),
        }));

        if (!mounted) return;

        setContacts(formatted);

        setSelectedContact((previous) => {
          if (!formatted.length) return null;

          return (
            formatted.find((contact) => contact.id === previous?.id) ||
            formatted[0]
          );
        });
      } catch (error) {
        console.error("[Registrar Messages] Failed to load contacts:", error);

        if (mounted) {
          setContacts([]);
          setSelectedContact(null);
        }
      } finally {
        if (mounted) setContactsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const getOrCreateDirectConversation = async (otherUserId) => {
    if (!otherUserId) {
      throw new Error("A valid contact is required.");
    }

    const { data, error } = await supabaseRegistrar.rpc(
      "create_direct_conversation",
      { p_other_user_id: otherUserId }
    );

    if (error) throw error;

    return { id: data };
  };

  // =========================================================
  // ACTIVE CONVERSATION
  // =========================================================

  useEffect(() => {
    if (!currentUser?.id || !selectedContact?.id) return;

    let mounted = true;
    let channel = null;
    let pollTimer = null;

    const contactId = selectedContact.id;

    const loadConversation = async () => {
      try {
        let conversation = conversations[contactId];

        if (!conversation) {
          conversation = await getOrCreateDirectConversation(contactId);

          if (!mounted) return;

          setConversations((previous) => ({
            ...previous,
            [contactId]: conversation,
          }));
        }

        if (!conversation?.id) {
          throw new Error("Conversation could not be created.");
        }

        const { data: rows, error } = await supabaseRegistrar
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        let attachmentMap = {};

        try {
          attachmentMap = await loadAttachmentsForMessages(rows || []);
        } catch (error) {
          console.error(
            "[Registrar Messages] Attachment history could not be loaded:",
            error
          );
        }

        if (!mounted) return;

        let reactionRows = [];

        const loadedMessageIds = (rows || [])
          .map((row) => row.id)
          .filter(Boolean);

        if (loadedMessageIds.length) {
          const { data: fetchedReactions, error: reactionError } =
            await supabaseRegistrar
              .from("message_reactions")
              .select("id, message_id, user_id, reaction, created_at")
              .in("message_id", loadedMessageIds);

          if (reactionError) {
            console.error(
              "[Registrar Messages] Failed to load reactions:",
              reactionError
            );
          } else {
            reactionRows = fetchedReactions || [];
          }
        }

        const reactionsByMessage = reactionRows.reduce((map, reaction) => {
          (map[reaction.message_id] ||= []).push(reaction);
          return map;
        }, {});

        setMessages((previous) => ({
          ...previous,
          [contactId]: (rows || [])
            .map((row) => ({
              ...normalizeMessage(row),
              attachments: attachmentMap[row.id] || [],
              reactions: reactionsByMessage[row.id] || [],
            }))
            .filter(Boolean),
        }));

        // Opening the conversation confirms incoming messages were received
        // and marks the latest message as seen.
        const incomingRows = (rows || []).filter(
          (row) => row.sender_id !== currentUser.id
        );

        await Promise.all(
          incomingRows.map((row) => markMessageDelivered(row.id))
        );

        const latestLoadedMessage = (rows || []).at(-1);

        if (latestLoadedMessage) {
          await markConversationSeen(conversation.id, latestLoadedMessage.id);
        }

        await refreshOutgoingMessageStatuses(conversation.id, contactId);

        // Refresh the badge calculation after recording the read position.
        void refreshUnreadCounts();

        channel = supabaseRegistrar
          .channel(`registrar-messages-${conversation.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversation.id}`,
            },
            (payload) => {
              console.log(
                "[Registrar Messages] Realtime INSERT received:",
                payload.new?.id,
                payload.new?.conversation_id
              );

              if (!mounted) return;

              const incoming = normalizeMessage({
                ...payload.new,
                attachments: [],
              });

              if (!incoming) return;

              if (incoming.sender_id !== currentUser.id) {
                void markMessageDelivered(incoming.id);
                void markConversationSeen(conversation.id, incoming.id);
              } else {
                void refreshOutgoingMessageStatuses(conversation.id, contactId);
              }

              setMessages((previous) => {
                const existing = previous[contactId] || [];

                if (existing.some((message) => message.id === incoming.id)) {
                  return previous;
                }

                return {
                  ...previous,
                  [contactId]: [...existing, incoming],
                };
              });

              void refreshUnreadCounts();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "message_attachments",
            },
            async (payload) => {
              if (!mounted || !payload.new?.message_id) return;

              const { data: messageRow, error: lookupError } =
                await supabaseRegistrar
                  .from("messages")
                  .select("id, conversation_id")
                  .eq("id", payload.new.message_id)
                  .eq("conversation_id", conversation.id)
                  .maybeSingle();

              if (lookupError) {
                console.error(
                  "[Registrar Messages] Attachment message lookup failed:",
                  lookupError
                );
                return;
              }

              if (!messageRow || !mounted) return;

              try {
                const map = await loadAttachmentsForMessages([messageRow]);

                if (!mounted) return;

                setMessages((previous) => {
                  const existing = previous[contactId] || [];

                  return {
                    ...previous,
                    [contactId]: existing.map((message) => {
                      if (message.id !== messageRow.id) return message;

                      const merged = [...(message.attachments || [])];

                      for (const attachment of map[messageRow.id] || []) {
                        if (!merged.some((item) => item.id === attachment.id)) {
                          merged.push(attachment);
                        }
                      }

                      return { ...message, attachments: merged };
                    }),
                  };
                });
              } catch (error) {
                console.error(
                  "[Registrar Messages] Failed to display incoming attachment:",
                  error
                );
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversation.id}`,
            },
            (payload) => {
              if (!mounted) return;

              const updated = normalizeMessage(payload.new);

              setMessages((previous) => ({
                ...previous,
                [contactId]: (previous[contactId] || []).map((message) =>
                  message.id === updated.id
                    ? {
                        ...message,
                        ...updated,
                        status: message.status || updated.status,
                        deliveredAt:
                          message.deliveredAt || updated.deliveredAt || null,
                        seenAt: message.seenAt || updated.seenAt || null,
                        attachments: message.attachments || [],
                        reactions: message.reactions || [],
                      }
                    : message
                ),
              }));

              void refreshUnreadCounts();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "message_reactions",
            },
            async (payload) => {
              if (!mounted) return;

              const messageId =
                payload.new?.message_id || payload.old?.message_id;

              if (!messageId) return;

              const { data: relatedMessage, error: relatedError } =
                await supabaseRegistrar
                  .from("messages")
                  .select("id, conversation_id")
                  .eq("id", messageId)
                  .eq("conversation_id", conversation.id)
                  .maybeSingle();

              if (relatedError || !relatedMessage || !mounted) return;

              const { data: freshReactions, error: freshError } =
                await supabaseRegistrar
                  .from("message_reactions")
                  .select("id, message_id, user_id, reaction, created_at")
                  .eq("message_id", messageId);

              if (freshError || !mounted) return;

              setMessages((previous) => ({
                ...previous,
                [contactId]: (previous[contactId] || []).map((message) =>
                  message.id === messageId
                    ? { ...message, reactions: freshReactions || [] }
                    : message
                ),
              }));
            }
          )
          .subscribe((status) =>
            console.log("[Registrar Messages] Realtime status:", status)
          );

        // Fallback sync for the active conversation.
        pollTimer = setInterval(async () => {
          try {
            const { data: freshRows, error: freshError } =
              await supabaseRegistrar
                .from("messages")
                .select("*")
                .eq("conversation_id", conversation.id)
                .order("created_at", { ascending: true });

            if (freshError || !mounted) {
              if (freshError) {
                console.warn(
                  "[Registrar Messages] Realtime fallback sync failed:",
                  freshError.message
                );
              }
              return;
            }

            const existing = messagesRefForSync.current?.[contactId] || [];

            const existingById = new Map(
              existing.map((item) => [item.id, item])
            );

            const messageIds = (freshRows || []).map((row) => row.id);
            let reactionsByMessageId = {};

            if (messageIds.length) {
              const { data: freshReactions, error: reactionsError } =
                await supabaseRegistrar
                  .from("message_reactions")
                  .select("id, message_id, user_id, reaction, created_at")
                  .in("message_id", messageIds);

              if (reactionsError) {
                console.warn(
                  "[Registrar Messages] Reaction fallback sync failed:",
                  reactionsError.message
                );
              } else {
                for (const reaction of freshReactions || []) {
                  if (!reactionsByMessageId[reaction.message_id]) {
                    reactionsByMessageId[reaction.message_id] = [];
                  }

                  reactionsByMessageId[reaction.message_id].push(reaction);
                }
              }
            }

            const missingRows = (freshRows || []).filter(
              (row) => !existingById.has(row.id)
            );

            let attachmentMap = {};

            if (missingRows.length) {
              try {
                attachmentMap = await loadAttachmentsForMessages(missingRows);
              } catch (attachmentError) {
                console.warn(
                  "[Registrar Messages] Could not sync new attachments:",
                  attachmentError
                );
              }
            }

            if (!mounted) return;

            setMessages((previous) => {
              const current = previous[contactId] || [];
              const byId = new Map(current.map((item) => [item.id, item]));

              for (const row of freshRows || []) {
                const old = byId.get(row.id);
                const normalized = normalizeMessage(row);

                byId.set(row.id, {
                  ...normalized,
                  status: old?.status || normalized.status,
                  deliveredAt:
                    old?.deliveredAt || normalized.deliveredAt || null,
                  seenAt: old?.seenAt || normalized.seenAt || null,
                  attachments: old?.attachments?.length
                    ? old.attachments
                    : attachmentMap[row.id] || [],
                  reactions: Object.prototype.hasOwnProperty.call(
                    reactionsByMessageId,
                    row.id
                  )
                    ? reactionsByMessageId[row.id]
                    : old?.reactions || [],
                });
              }

              return {
                ...previous,
                [contactId]: Array.from(byId.values()).sort(
                  (a, b) =>
                    new Date(a.created_at || 0) - new Date(b.created_at || 0)
                ),
              };
            });

            const incomingFreshRows = (freshRows || []).filter(
              (row) => row.sender_id !== currentUser.id
            );

            await Promise.all(
              incomingFreshRows.map((row) => markMessageDelivered(row.id))
            );

            const latestFreshMessage = (freshRows || []).at(-1);

            if (latestFreshMessage) {
              await markConversationSeen(
                conversation.id,
                latestFreshMessage.id
              );
            }

            await refreshOutgoingMessageStatuses(conversation.id, contactId);
            void refreshUnreadCounts();
          } catch (syncError) {
            console.warn(
              "[Registrar Messages] Realtime fallback sync error:",
              syncError
            );
          }
        }, 1500);
      } catch (error) {
        console.error(
          "[Registrar Messages] Failed to load conversation:",
          error
        );
      }
    };

    loadConversation();

    return () => {
      mounted = false;

      if (pollTimer) clearInterval(pollTimer);
      if (channel) void supabaseRegistrar.removeChannel(channel);
    };
  }, [
    currentUser?.id,
    selectedContact?.id,
    conversations,
    normalizeMessage,
    loadAttachmentsForMessages,
    refreshUnreadCounts,
  ]);

  const filteredContacts = contacts.filter((contact) =>
    `${contact.name} ${contact.role}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedContact
    ? messages[selectedContact.id] || []
    : [];

  // =========================================================
  // AUTO-SCROLL
  // =========================================================

  const wasNearBottomRef = useRef(true);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    wasNearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      140;
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (wasNearBottomRef.current || currentMessages.length <= 1) {
      requestAnimationFrame(() =>
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        })
      );
    }
  }, [currentMessages, selectedContact?.id]);

  // =========================================================
  // EDIT / DELETE / REACTIONS
  // =========================================================

  const handleStartEdit = (message) => {
    setMessageActionError("");
    setEditingMessageId(message.id);
    setEditInput(message.text || "");
  };

  const handleSaveEdit = async (messageId) => {
    const content = editInput.trim();

    if (!content) {
      setMessageActionError(
        "A message cannot be empty. Use Delete if you want to remove it."
      );
      return;
    }

    try {
      setMessageActionError("");

      const { error } = await supabaseRegistrar.rpc("edit_message", {
        p_message_id: messageId,
        p_content: content,
      });

      if (error) throw error;

      setMessages((previous) => ({
        ...previous,
        [selectedContact.id]: (previous[selectedContact.id] || []).map(
          (message) =>
            message.id === messageId
              ? {
                  ...message,
                  text: content,
                  content,
                  editedAt: new Date().toISOString(),
                }
              : message
        ),
      }));

      setEditingMessageId(null);
      setEditInput("");
    } catch (error) {
      console.error("[Registrar Messages] Failed to edit message:", error);
      setMessageActionError(error?.message || "Couldn't edit this message.");
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      setMessageActionError("");

      const { error } = await supabaseRegistrar.rpc("delete_message", {
        p_message_id: message.id,
      });

      if (error) throw error;

      setMessages((previous) => ({
        ...previous,
        [selectedContact.id]: (previous[selectedContact.id] || []).map((item) =>
          item.id === message.id
            ? {
                ...item,
                text: "This message was deleted.",
                isDeleted: true,
                attachments: [],
                reactions: [],
              }
            : item
        ),
      }));

      if (editingMessageId === message.id) {
        setEditingMessageId(null);
        setEditInput("");
      }

      void refreshUnreadCounts();
    } catch (error) {
      console.error("[Registrar Messages] Failed to delete message:", error);
      setMessageActionError(error?.message || "Couldn't delete this message.");
    }
  };

  const handleReaction = async (message, reaction) => {
    if (
      !currentUser?.id ||
      reactionBusyId === message.id ||
      message.isDeleted
    ) {
      return;
    }

    const existing = (message.reactions || []).find(
      (item) => item.user_id === currentUser.id
    );

    setReactionBusyId(message.id);
    setMessageActionError("");

    try {
      const rpc =
        existing?.reaction === reaction
          ? "remove_message_reaction"
          : "set_message_reaction";

      const args =
        rpc === "remove_message_reaction"
          ? { p_message_id: message.id }
          : { p_message_id: message.id, p_reaction: reaction };

      const { error } = await supabaseRegistrar.rpc(rpc, args);
      if (error) throw error;

      const { data: refreshed, error: refreshError } = await supabaseRegistrar
        .from("message_reactions")
        .select("id, message_id, user_id, reaction, created_at")
        .eq("message_id", message.id);

      if (refreshError) throw refreshError;

      setMessages((previous) => ({
        ...previous,
        [selectedContact.id]: (previous[selectedContact.id] || []).map((item) =>
          item.id === message.id
            ? { ...item, reactions: refreshed || [] }
            : item
        ),
      }));
    } catch (error) {
      console.error("[Registrar Messages] Failed to update reaction:", error);
      setMessageActionError(error?.message || "Couldn't update reaction.");
    } finally {
      setReactionBusyId(null);
    }
  };

  // =========================================================
  // FILE SELECTION / SENDING
  // =========================================================

  const handleFileSelection = (event) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";

    if (!incoming.length) return;

    setAttachmentError("");

    setSelectedFiles((previous) => {
      const combined = [...previous];

      for (const file of incoming) {
        if (combined.length >= MAX_FILES) {
          setAttachmentError(
            `You can attach up to ${MAX_FILES} files per message.`
          );
          break;
        }

        if (file.size > MAX_FILE_SIZE) {
          setAttachmentError(`${file.name} exceeds the 10 MB per-file limit.`);
          continue;
        }

        if (
          combined.some(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified
          )
        ) {
          continue;
        }

        combined.push(file);
      }

      return combined;
    });
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!selectedContact || !currentUser?.id || uploading) return;

    const text = messageInput.trim();
    const filesToSend = [...selectedFiles];

    if (!text && !filesToSend.length) return;

    setUploading(true);
    setAttachmentError("");

    try {
      let conversation = conversations[selectedContact.id];

      if (!conversation) {
        conversation = await getOrCreateDirectConversation(selectedContact.id);

        setConversations((previous) => ({
          ...previous,
          [selectedContact.id]: conversation,
        }));
      }

      if (!conversation?.id) {
        throw new Error("Conversation could not be found.");
      }

      // Create the message first so the Storage path can include its UUID.
      const { data: sentResult, error: sendError } =
        await supabaseRegistrar.rpc("send_message", {
          p_conversation_id: conversation.id,
          p_content: text || null,
          p_reply_to_message_id: null,
        });

      if (sendError) throw sendError;

      const sentMessage = Array.isArray(sentResult)
        ? sentResult[0]
        : sentResult;

      if (!sentMessage?.id) {
        throw new Error(
          "The message was created but no message ID was returned."
        );
      }

      const normalizedSentMessage = {
        ...normalizeMessage({
          ...sentMessage,
          content: sentMessage.content ?? (text || null),
          sender_id: sentMessage.sender_id || currentUser.id,
        }),
        attachments: [],
        reactions: [],
      };

      setMessages((previous) => {
        const existing = previous[selectedContact.id] || [];

        if (
          existing.some((message) => message.id === normalizedSentMessage.id)
        ) {
          return previous;
        }

        return {
          ...previous,
          [selectedContact.id]: [...existing, normalizedSentMessage].sort(
            (a, b) =>
              new Date(a.created_at || 0).getTime() -
              new Date(b.created_at || 0).getTime()
          ),
        };
      });

      setMessageInput("");
      setSelectedFiles([]);

      const failures = [];

      for (const file of filesToSend) {
        const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
        const uniqueName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}-${safeName}`;

        const filePath = `${currentUser.id}/${conversation.id}/${sentMessage.id}/${uniqueName}`;

        const { error: uploadError } = await supabaseRegistrar.storage
          .from(MESSAGE_ATTACHMENT_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error(
            "[Registrar Messages] Attachment upload failed:",
            uploadError
          );
          failures.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: attachmentResult, error: metadataError } =
          await supabaseRegistrar.rpc("add_message_attachment", {
            p_message_id: sentMessage.id,
            p_file_name: file.name,
            p_file_path: filePath,
            p_file_type: file.type || "application/octet-stream",
            p_file_size: file.size,
          });

        if (metadataError) {
          console.error(
            "[Registrar Messages] Attachment metadata insert failed:",
            metadataError
          );

          failures.push(
            `${file.name} uploaded but its attachment record failed: ${metadataError.message}`
          );

          continue;
        }

        const saved = Array.isArray(attachmentResult)
          ? attachmentResult[0]
          : attachmentResult;

        const { data: signedData, error: signedError } =
          await supabaseRegistrar.storage
            .from(MESSAGE_ATTACHMENT_BUCKET)
            .createSignedUrl(filePath, ATTACHMENT_URL_EXPIRY);

        if (signedError) {
          console.error(
            "[Registrar Messages] Failed to sign uploaded attachment:",
            signedError
          );
        }

        const attachment = {
          id: saved?.id || `${sentMessage.id}-${filePath}`,
          fileName: saved?.file_name || file.name,
          filePath,
          fileType: saved?.file_type || file.type || "application/octet-stream",
          fileSize: Number(saved?.file_size ?? file.size),
          createdAt: saved?.created_at || new Date().toISOString(),
          url: signedData?.signedUrl || null,
        };

        setMessages((previous) => {
          const existing = previous[selectedContact.id] || [];

          const index = existing.findIndex(
            (message) => message.id === sentMessage.id
          );

          if (index < 0) {
            const normalized = normalizeMessage({
              ...sentMessage,
              content: text || null,
            });

            return {
              ...previous,
              [selectedContact.id]: [
                ...existing,
                { ...normalized, attachments: [attachment] },
              ],
            };
          }

          return {
            ...previous,
            [selectedContact.id]: existing.map((message) =>
              message.id === sentMessage.id
                ? {
                    ...message,
                    attachments: [...(message.attachments || []), attachment],
                  }
                : message
            ),
          };
        });
      }

      if (failures.length) {
        setAttachmentError(
          `Message sent, but some files could not be attached:\n${failures.join(
            "\n"
          )}`
        );
      }

      void refreshUnreadCounts();
    } catch (error) {
      console.error("[Registrar Messages] Failed to send message:", error);

      setAttachmentError(
        error?.message || "Failed to send message. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);

    // Immediately clear this contact's badge while its conversation opens.
    setUnreadByContact((previous) => ({
      ...previous,
      [contact.id]: 0,
    }));

    setMessageInput("");
    setSelectedFiles([]);
    setAttachmentError("");
    setMessageActionError("");
    setEditingMessageId(null);
    setEditInput("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes < 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // =========================================================
  // PRESENTATIONAL COMPONENTS
  // =========================================================

  const MessageAttachments = ({ attachments = [] }) => {
    if (!attachments.length) return null;

    return (
      <div className="mt-2 space-y-2">
        {attachments.map((attachment) => {
          const isImage = attachment.fileType?.startsWith("image/");
          const isPdf =
            attachment.fileType === "application/pdf" ||
            attachment.fileName?.toLowerCase().endsWith(".pdf");

          return (
            <div
              key={attachment.id}
              className={`min-w-0 max-w-full overflow-hidden rounded-lg border ${
                darkMode
                  ? "border-slate-600 bg-slate-900/60"
                  : "border-slate-200 bg-white/80"
              }`}
            >
              {isImage && attachment.url && (
                <button
                  type="button"
                  onClick={() => setImagePreview(attachment)}
                  title={`Preview ${attachment.fileName}`}
                  className="block w-full text-left"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    loading="lazy"
                    className="max-h-64 max-w-full rounded-t-lg object-contain"
                  />
                </button>
              )}

              <div className="flex min-w-0 items-center gap-2 p-2.5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700 text-[10px] font-bold text-white">
                  {isImage ? "IMG" : isPdf ? "PDF" : "FILE"}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words text-[11px] font-semibold ${
                      darkMode ? "text-slate-100" : "text-slate-800"
                    }`}
                  >
                    {attachment.fileName}
                  </p>

                  <p
                    className={`mt-1 text-[10px] ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>

                {attachment.url ? (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 rounded-md bg-slate-700 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-slate-600"
                    title={`Open ${attachment.fileName}`}
                  >
                    Open
                  </a>
                ) : (
                  <span
                    className="flex-shrink-0 text-[10px] text-red-500"
                    title="Could not create a signed URL for this file."
                  >
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ContactAvatar = ({ contact, active, size = "normal" }) => {
    const sizeClass =
      size === "small" ? "w-9 h-9 text-[10px]" : "w-10 h-10 text-xs";

    return (
      <div
        className={`${sizeClass} flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center font-bold ${getAvatarClass(
          active
        )}`}
      >
        {contact.profilePhotoUrl ? (
          <img
            src={contact.profilePhotoUrl}
            alt={contact.name}
            className="w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          getInitials(contact.name)
        )}
      </div>
    );
  };

  const UnreadBadge = ({ contactId }) => {
    const count = unreadByContact[contactId] || 0;

    if (count <= 0) return null;

    return (
      <span
        className="inline-flex min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 py-1 text-[10px] font-bold leading-none text-white"
        aria-label={`${count} unread messages`}
      >
        {count > 9 ? "9+" : count}
      </span>
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8 bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-4 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Registrar Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Messages
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            Communicate with students and internship-related contacts.
          </p>
        </div>

        <section
          className={`w-full border rounded-xl overflow-hidden shadow-sm ${mainContainerClass}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] min-h-0 md:h-[calc(100vh-220px)] md:max-h-[760px]">
            {/* DESKTOP CONTACT LIST */}
            <aside
              className={`hidden md:flex flex-col min-h-0 border-r ${panelClass}`}
            >
              <div className={`p-4 border-b flex-shrink-0 ${panelClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-sm font-bold ${headingClass}`}>
                    Students
                  </h2>

                  <span className={`text-xs ${mutedClass}`}>
                    {contacts.length}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search contacts..."
                    className={`w-full h-9 px-3 pr-8 rounded-lg border text-xs outline-none transition ${inputClass}`}
                  />

                  <span
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${mutedClass}`}
                  >
                    🔍
                  </span>
                </div>
              </div>

              <div
                className={`flex-1 min-h-0 overflow-y-auto p-3 space-y-2 ${panelClass}`}
              >
                {contactsLoading ? (
                  <div className="py-8 text-center">
                    <p className={`text-xs ${mutedClass}`}>
                      Loading contacts...
                    </p>
                  </div>
                ) : filteredContacts.length ? (
                  filteredContacts.map((contact) => {
                    const active = selectedContact?.id === contact.id;

                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${getContactClass(
                          active
                        )}`}
                      >
                        <div className="flex items-center gap-3">
                          <ContactAvatar contact={contact} active={active} />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-xs font-bold truncate ${
                                  active
                                    ? "text-white"
                                    : darkMode
                                    ? "text-slate-100"
                                    : "text-slate-900"
                                }`}
                              >
                                {contact.name}
                              </p>

                              <UnreadBadge contactId={contact.id} />
                            </div>

                            <p
                              className={`text-[10px] mt-1 truncate ${
                                active
                                  ? "text-slate-300"
                                  : darkMode
                                  ? "text-slate-500"
                                  : "text-slate-400"
                              }`}
                            >
                              {contact.role}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <p className={`text-xs ${mutedClass}`}>
                      No students found.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* MOBILE CONTACT LIST */}
            <div className={`md:hidden border-b ${panelClass}`}>
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-bold ${headingClass}`}>
                      Students
                    </h2>

                    <p className={`text-[10px] mt-0.5 ${mutedClass}`}>
                      Swipe to switch conversation
                    </p>
                  </div>

                  <span className={`text-xs ${mutedClass}`}>
                    {contacts.length}
                  </span>
                </div>

                <div className="relative mt-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search contacts..."
                    className={`w-full h-9 px-3 pr-8 rounded-lg border text-xs outline-none transition ${inputClass}`}
                  />

                  <span
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${mutedClass}`}
                  >
                    🔍
                  </span>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto overflow-y-hidden px-3 pb-3 pt-1 snap-x snap-mandatory overscroll-x-contain">
                {contactsLoading ? (
                  <div className="w-full py-4 text-center">
                    <p className={`text-xs ${mutedClass}`}>
                      Loading contacts...
                    </p>
                  </div>
                ) : filteredContacts.length ? (
                  filteredContacts.map((contact) => {
                    const active = selectedContact?.id === contact.id;

                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact)}
                        className={`flex-shrink-0 snap-start min-w-[150px] max-w-[190px] p-2.5 rounded-xl border text-left transition-all duration-200 ${getContactClass(
                          active
                        )}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ContactAvatar
                            contact={contact}
                            active={active}
                            size="small"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p
                                className={`text-[11px] font-bold truncate ${
                                  active
                                    ? "text-white"
                                    : darkMode
                                    ? "text-slate-100"
                                    : "text-slate-900"
                                }`}
                              >
                                {contact.name}
                              </p>

                              <UnreadBadge contactId={contact.id} />
                            </div>

                            <p
                              className={`text-[9px] mt-0.5 truncate ${
                                active
                                  ? "text-slate-300"
                                  : darkMode
                                  ? "text-slate-500"
                                  : "text-slate-400"
                              }`}
                            >
                              {contact.role}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="w-full py-4 text-center">
                    <p className={`text-xs ${mutedClass}`}>
                      No students found.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CHAT PANEL */}
            <div
              className={`flex flex-col min-w-0 min-h-0 h-[500px] sm:h-[550px] md:h-auto ${chatClass}`}
            >
              <div
                className={`h-[64px] sm:h-[72px] px-4 sm:px-5 border-b flex items-center justify-between flex-shrink-0 ${
                  darkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                {selectedContact ? (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <ContactAvatar
                        contact={selectedContact}
                        active
                        size="large"
                      />

                      <div className="min-w-0">
                        <h2
                          className={`text-sm font-bold truncate ${headingClass}`}
                        >
                          {selectedContact.name}
                        </h2>

                        <p className={`text-[10px] truncate ${mutedClass}`}>
                          {selectedContact.role}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`w-9 h-9 flex-shrink-0 rounded-lg border transition ${
                        darkMode
                          ? "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      title="More options"
                    >
                      ⋮
                    </button>
                  </>
                ) : (
                  <div>
                    <h2 className={`text-sm font-bold ${headingClass}`}>
                      No contact selected
                    </h2>

                    <p className={`text-[10px] mt-1 ${mutedClass}`}>
                      Select a student to start a conversation.
                    </p>
                  </div>
                )}
              </div>

              {/* MESSAGE HISTORY */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 overscroll-contain ${chatClass}`}
              >
                <div className="space-y-4">
                  {selectedContact && currentMessages.length ? (
                    currentMessages.map((message) => {
                      const isSent = message.sender === "sent";
                      const hasAttachments =
                        (message.attachments || []).length > 0;
                      const isEditing = editingMessageId === message.id;

                      const reactionOptions = [
                        { key: "like", emoji: "👍" },
                        { key: "love", emoji: "❤️" },
                        { key: "haha", emoji: "😂" },
                        { key: "wow", emoji: "😮" },
                        { key: "sad", emoji: "😢" },
                        { key: "angry", emoji: "😡" },
                      ];

                      const ownReaction = (message.reactions || []).find(
                        (item) => item.user_id === currentUser?.id
                      )?.reaction;

                      const groupedReactions = reactionOptions
                        .map((option) => ({
                          ...option,
                          count: (message.reactions || []).filter(
                            (item) => item.reaction === option.key
                          ).length,
                        }))
                        .filter((item) => item.count > 0);

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isSent ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[88%] sm:max-w-[75%] ${
                              isSent ? "items-end" : "items-start"
                            } flex min-w-0 flex-col`}
                          >
                            {(message.text ||
                              hasAttachments ||
                              message.isDeleted ||
                              isEditing) && (
                              <div
                                className={`max-w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                                  isSent
                                    ? "bg-slate-800 text-white rounded-br-sm"
                                    : darkMode
                                    ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm"
                                    : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-sm"
                                }`}
                              >
                                {isEditing ? (
                                  <div className="min-w-[220px] space-y-2">
                                    <textarea
                                      value={editInput}
                                      onChange={(event) =>
                                        setEditInput(event.target.value)
                                      }
                                      rows={3}
                                      maxLength={10000}
                                      className="w-full rounded-lg border border-slate-500 bg-slate-900/20 p-2 text-xs text-current outline-none"
                                      autoFocus
                                    />

                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessageId(null);
                                          setEditInput("");
                                        }}
                                        className="rounded-md px-2 py-1 text-[10px] font-bold"
                                      >
                                        Cancel
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSaveEdit(message.id)
                                        }
                                        className="rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : message.isDeleted ? (
                                  <em className="opacity-75">
                                    This message was deleted.
                                  </em>
                                ) : (
                                  <>
                                    {message.text && (
                                      <div>
                                        {message.text}

                                        {message.editedAt && (
                                          <span className="ml-1 text-[9px] opacity-60">
                                            (edited)
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    <MessageAttachments
                                      attachments={message.attachments || []}
                                    />
                                  </>
                                )}
                              </div>
                            )}

                            {!message.isDeleted && (
                              <div
                                className={`mt-1 flex flex-wrap items-center gap-1 ${
                                  isSent ? "justify-end" : "justify-start"
                                }`}
                              >
                                {reactionOptions.map((option) => (
                                  <button
                                    key={option.key}
                                    type="button"
                                    disabled={reactionBusyId === message.id}
                                    onClick={() =>
                                      handleReaction(message, option.key)
                                    }
                                    title={option.key}
                                    aria-label={`React ${option.key}`}
                                    className={`rounded-full border px-1.5 py-0.5 text-[11px] transition disabled:opacity-50 ${
                                      ownReaction === option.key
                                        ? "border-blue-400 bg-blue-500/20"
                                        : darkMode
                                        ? "border-slate-700 hover:bg-slate-800"
                                        : "border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {option.emoji}
                                  </button>
                                ))}

                                {isSent && !isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(message)}
                                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${mutedClass} hover:text-blue-500`}
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteMessage(message)
                                      }
                                      className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-red-500 hover:text-red-400"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {groupedReactions.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {groupedReactions.map((reaction) => (
                                  <span
                                    key={reaction.key}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                      darkMode
                                        ? "border-slate-700 bg-slate-800"
                                        : "border-slate-200 bg-slate-50"
                                    }`}
                                  >
                                    {reaction.emoji} {reaction.count}
                                  </span>
                                ))}
                              </div>
                            )}

                            <span
                              className={`text-[9px] mt-1 px-1 ${mutedClass}`}
                            >
                              {message.time}
                            </span>

                            {isSent && !message.isDeleted && (
                              <span
                                className={`mt-0.5 flex items-center gap-1 px-1 text-[10px] ${
                                  message.status === "seen"
                                    ? "text-sky-500"
                                    : mutedClass
                                }`}
                                title={
                                  message.status === "seen"
                                    ? "Seen"
                                    : message.status === "delivered"
                                    ? "Delivered"
                                    : "Sent"
                                }
                              >
                                {message.status === "seen" ? (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="font-bold tracking-[-3px] pr-0.5"
                                    >
                                      ✓✓
                                    </span>
                                    <span>Seen</span>
                                  </>
                                ) : message.status === "delivered" ? (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="font-bold tracking-[-3px] pr-0.5"
                                    >
                                      ✓✓
                                    </span>
                                    <span>Delivered</span>
                                  </>
                                ) : (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="font-bold"
                                    >
                                      ✓
                                    </span>
                                    <span>Sent</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className={`text-xs ${mutedClass}`}>
                        {selectedContact
                          ? "No messages yet."
                          : "Select a contact to view messages."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* COMPOSER */}
              <div
                className={`border-t p-3 sm:p-4 flex-shrink-0 ${
                  darkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                {selectedFiles.length > 0 && (
                  <div
                    className={`mb-3 rounded-lg border p-2.5 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className={`text-[11px] font-bold ${headingClass}`}>
                        Files to attach ({selectedFiles.length}/{MAX_FILES})
                      </p>

                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => setSelectedFiles([])}
                        className={`text-[10px] font-semibold ${mutedClass} hover:text-red-500 disabled:opacity-50`}
                      >
                        Remove all
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <span className="text-sm">📎</span>

                          <span
                            className={`min-w-0 flex-1 break-words text-[10px] ${headingClass}`}
                          >
                            {file.name}{" "}
                            <span className={mutedClass}>
                              ({formatFileSize(file.size)})
                            </span>
                          </span>

                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() =>
                              setSelectedFiles((previous) =>
                                previous.filter((_, i) => i !== index)
                              )
                            }
                            className="px-1 text-xs text-red-500 disabled:opacity-50"
                            aria-label={`Remove ${file.name}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {attachmentError && (
                  <div
                    role="alert"
                    className="mb-3 whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-700"
                  >
                    {attachmentError}
                  </div>
                )}

                {messageActionError && (
                  <div
                    role="alert"
                    className="mb-3 whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-700"
                  >
                    {messageActionError}
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelection}
                  />

                  <button
                    type="button"
                    disabled={
                      !selectedContact ||
                      uploading ||
                      selectedFiles.length >= MAX_FILES
                    }
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-11 w-11 flex-shrink-0 rounded-lg border text-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    title="Attach files"
                    aria-label="Attach files"
                  >
                    📎
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    placeholder={
                      selectedContact
                        ? `Message ${selectedContact.name}...`
                        : "Select a contact..."
                    }
                    autoComplete="off"
                    disabled={!selectedContact || uploading}
                    className={`flex-1 min-w-0 h-11 px-3 sm:px-4 rounded-lg border text-xs outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${inputClass}`}
                  />

                  <button
                    type="submit"
                    disabled={
                      !selectedContact ||
                      uploading ||
                      (!messageInput.trim() && !selectedFiles.length)
                    }
                    className="h-11 px-4 sm:px-5 flex-shrink-0 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {uploading ? "Sending..." : "Send"}
                  </button>
                </form>

                <p className={`mt-2 text-[9px] ${mutedClass}`}>
                  Attach up to {MAX_FILES} files, maximum 10 MB each.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative flex max-h-[92vh] max-w-[95vw] flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-900 shadow"
              aria-label="Close image preview"
            >
              ×
            </button>

            <img
              src={imagePreview.url}
              alt={imagePreview.fileName}
              className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
            />

            <div className="flex max-w-[92vw] flex-wrap items-center justify-center gap-3 text-center text-xs text-white">
              <span className="break-all">{imagePreview.fileName}</span>

              <a
                href={imagePreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white px-3 py-2 font-bold text-slate-900"
              >
                Open / Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
