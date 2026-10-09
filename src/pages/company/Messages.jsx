import React, { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

const MESSAGE_ATTACHMENT_BUCKET = "message-attachments";
const ATTACHMENT_URL_EXPIRY = 60 * 60;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MESSAGE_REACTIONS = [
  { value: "like", emoji: "👍", label: "Like" },
  { value: "love", emoji: "❤️", label: "Love" },
  { value: "haha", emoji: "😂", label: "Haha" },
  { value: "wow", emoji: "😮", label: "Wow" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "angry", emoji: "😡", label: "Angry" },
];

// Reuse signed URLs across polling cycles.
// URLs are refreshed only when they are close to expiration.
const attachmentUrlCache = new Map();
const ATTACHMENT_URL_REFRESH_BUFFER = 5 * 60 * 1000;


const MessageAttachments = ({ attachments = [], darkMode, formatFileSize }) => {
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
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open ${attachment.fileName}`}
                className="block"
              >
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  loading="lazy"
                  decoding="async"
                  className="block max-h-64 max-w-full rounded-t-lg object-contain"
                />
              </a>
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

const Messages = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);

  // NEW: Persistent unread counts, reconstructed from Supabase.
  const [unreadByContact, setUnreadByContact] = useState({});

  const [messages, setMessages] = useState({});
  const [conversations, setConversations] = useState({});
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageInput, setEditMessageInput] = useState("");
  const [messageActionError, setMessageActionError] = useState("");
  const [messageActionBusy, setMessageActionBusy] = useState(false);

  const conversationsRef = useRef({});
  const messagesRef = useRef({});
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // NEW: Keep the latest contact/selection values available to async
  // unread-count refreshes without making them depend on message polling.
  const contactsRef = useRef(contacts);
  const selectedContactRef = useRef(selectedContact);
  const unreadRefreshVersionRef = useRef(0);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // =========================================================
  // THEME CLASSES
  // =========================================================

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

  const getContactClass = (active) => {
    if (active) {
      return darkMode
        ? "bg-slate-700 border-slate-600 text-white shadow-sm"
        : "bg-slate-800 border-slate-800 text-white shadow-sm";
    }

    return darkMode
      ? "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600"
      : "bg-white border-slate-200 text-slate-900 hover:bg-slate-100 hover:border-slate-400";
  };

  const getAvatarClass = (active) => {
    if (active) {
      return darkMode
        ? "bg-slate-600 text-slate-100"
        : "bg-white/15 text-white";
    }

    return darkMode
      ? "bg-slate-700 text-slate-300"
      : "bg-slate-200 text-slate-600";
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const buildName = (user) => {
    if (!user) return "Unknown Student";

    return (
      [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Student"
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes < 0) return "";

    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getProfilePhotoUrl = (storedPath) => {
    if (!storedPath) return null;

    const normalizedPath = storedPath.startsWith("profile-photos/")
      ? storedPath
      : `profile-photos/${storedPath}`;

    const { data } = supabaseCompany.storage
      .from("profile-photos")
      .getPublicUrl(normalizedPath);

    return data?.publicUrl || null;
  };

  const normalizeMessage = useCallback(
    (message) => {
      if (!message) return null;

      return {
        id: message.id,
        sender: message.sender_id === currentUser?.id ? "sent" : "received",
        text: message.content || "",
        time: message.created_at
          ? new Date(message.created_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : "",
        senderId: message.sender_id,
        conversationId: message.conversation_id,
        replyToMessageId: message.reply_to_message_id || null,
        isEdited: message.is_edited || false,
        editedAt: message.edited_at || null,
        isDeleted: message.is_deleted || false,
        createdAt: message.created_at,
        updatedAt: message.updated_at,
        // Receipt states are monotonic: normalization must not reset Seen to Sent.
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
      const { error } = await supabaseCompany.rpc("mark_message_delivered", {
        p_message_id: messageId,
      });

      if (error) {
        console.warn(
          "[Company Messages] Could not mark message delivered:",
          error.message
        );
      }
    } catch (error) {
      console.warn("[Company Messages] Delivery receipt failed:", error);
    }
  };

  const markConversationSeen = async (conversationId, latestMessageId) => {
    if (!conversationId || !latestMessageId || !currentUser?.id) return;

    try {
      const { error } = await supabaseCompany.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
        p_message_id: latestMessageId,
      });

      if (error) {
        console.warn(
          "[Company Messages] Could not mark conversation seen:",
          error.message
        );
      }
    } catch (error) {
      console.warn("[Company Messages] Read receipt failed:", error);
    }
  };

  // =========================================================
  // NEW: RECOVER UNREAD COUNTS FROM SUPABASE
  // =========================================================

  const refreshUnreadCounts = async () => {
    if (!currentUser?.id || contactsLoading) return;

    const refreshVersion = ++unreadRefreshVersionRef.current;

    try {
      // Get the conversations this company user belongs to.
      const { data: memberships, error: membershipsError } =
        await supabaseCompany
          .from("conversation_members")
          .select("conversation_id, joined_at")
          .eq("user_id", currentUser.id);

      if (membershipsError) {
        console.warn(
          "[Company Messages] Could not load conversation memberships:",
          membershipsError.message
        );
        return;
      }

      const membershipByConversation = new Map(
        (memberships || []).map((item) => [
          item.conversation_id,
          item.joined_at,
        ])
      );

      const conversationIds = [...membershipByConversation.keys()];

      if (!conversationIds.length) {
        if (refreshVersion === unreadRefreshVersionRef.current) {
          setUnreadByContact({});
        }
        return;
      }

      // Load incoming messages and the company's last-read timestamps.
      const [messagesResult, readsResult] = await Promise.all([
        supabaseCompany
          .from("messages")
          .select("id, conversation_id, sender_id, created_at, is_deleted")
          .in("conversation_id", conversationIds)
          .neq("sender_id", currentUser.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true }),

        supabaseCompany
          .from("message_reads")
          .select("conversation_id, last_read_at")
          .eq("user_id", currentUser.id)
          .in("conversation_id", conversationIds),
      ]);

      if (messagesResult.error) {
        console.warn(
          "[Company Messages] Could not load unread messages:",
          messagesResult.error.message
        );
        return;
      }

      if (readsResult.error) {
        console.warn(
          "[Company Messages] Could not load read timestamps:",
          readsResult.error.message
        );
        return;
      }

      // Ignore stale requests if a newer refresh has already started.
      if (refreshVersion !== unreadRefreshVersionRef.current) return;

      const readAtByConversation = new Map(
        (readsResult.data || []).map((item) => [
          item.conversation_id,
          item.last_read_at ? new Date(item.last_read_at).getTime() : 0,
        ])
      );

      const contactIds = new Set(
        contactsRef.current.map((contact) => contact.id)
      );

      const openContactId = selectedContactRef.current?.id;
      const nextUnreadCounts = {};

      for (const message of messagesResult.data || []) {
        const senderId = message.sender_id;
        const conversationId = message.conversation_id;

        // Only count messages from contacts shown in this company's inbox.
        if (!contactIds.has(senderId)) continue;

        // The currently open conversation is treated as read.
        if (senderId === openContactId) continue;

        // Do not count messages sent before this user joined the conversation.
        const joinedAt = membershipByConversation.get(conversationId);

        if (
          joinedAt &&
          new Date(message.created_at).getTime() < new Date(joinedAt).getTime()
        ) {
          continue;
        }

        // Skip messages already covered by the user's last-read timestamp.
        const lastReadAt = readAtByConversation.get(conversationId);

        if (
          lastReadAt &&
          new Date(message.created_at).getTime() <= lastReadAt
        ) {
          continue;
        }

        nextUnreadCounts[senderId] = (nextUnreadCounts[senderId] || 0) + 1;
      }

      if (refreshVersion === unreadRefreshVersionRef.current) {
        setUnreadByContact(nextUnreadCounts);
      }
    } catch (error) {
      console.warn("[Company Messages] Unread-count refresh failed:", error);
    }
  };

  // =========================================================
  // NEW: REFRESH BADGES ON STARTUP AND INCOMING MESSAGES
  // =========================================================

  useEffect(() => {
    if (!currentUser?.id || contactsLoading) return undefined;

    let mounted = true;

    // Rebuild the badge counts after the inbox and contacts are loaded.
    void refreshUnreadCounts();

    // Listen globally so new messages in other conversations also update
    // their unread badges without requiring the user to open those chats.
    const channel = supabaseCompany
      .channel(`company-incoming-message-badges-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incoming = payload?.new;

          if (
            !mounted ||
            !incoming?.conversation_id ||
            !incoming?.id ||
            incoming.sender_id === currentUser.id
          ) {
            return;
          }

          // Keep the delivery receipt behavior for incoming messages.
          void markMessageDelivered(incoming.id);

          // Recalculate from the database instead of incrementing blindly.
          void refreshUnreadCounts();
        }
      )
      .subscribe((status) => {
        console.log(
          "[Company Messages] Incoming-message badge listener:",
          status
        );
      });

    return () => {
      mounted = false;

      // Invalidate any unread refresh still in progress.
      unreadRefreshVersionRef.current += 1;

      void supabaseCompany.removeChannel(channel);
    };
  }, [currentUser?.id, contactsLoading, contacts, selectedContact?.id]);

  const refreshOutgoingMessageStatuses = async (conversationId, contactId) => {
    if (!conversationId || !contactId || !currentUser?.id) return;

    try {
      const { data, error } = await supabaseCompany.rpc(
        "get_outgoing_message_statuses",
        {
          p_conversation_id: conversationId,
        }
      );

      if (error) {
        console.warn(
          "[Company Messages] Could not refresh delivery statuses:",
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
            : { status: "sent", deliveredAt: null, seenAt: null },
        ])
      );

      const rank = { sent: 0, delivered: 1, seen: 2 };

      setMessages((previous) => ({
        ...previous,
        [contactId]: (previous[contactId] || []).map((message) => {
          if (
            message.senderId !== currentUser.id ||
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
      console.warn("[Company Messages] Status refresh failed:", error);
    }
  };

  // =========================================================
  // LOAD ATTACHMENTS AND SIGNED URLS
  // =========================================================

  const loadAttachmentsForMessages = useCallback(async (messageRows) => {
    const messageIds = (messageRows || [])
      .map((message) => message.id)
      .filter(Boolean);

    if (!messageIds.length) return {};

    const { data: attachmentRows, error } = await supabaseCompany
      .from("message_attachments")
      .select(
        "id, message_id, file_name, file_path, file_type, file_size, created_at"
      )
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Company Messages] Attachment metadata error:", error);
      throw error;
    }

    const attachmentMap = {};

    await Promise.all(
      (attachmentRows || []).map(async (row) => {
        if (!attachmentMap[row.message_id]) {
          attachmentMap[row.message_id] = [];
        }

        const cacheKey = `${row.id}:${row.file_path}`;
        const cached = attachmentUrlCache.get(cacheKey);
        const now = Date.now();

        let signedUrl =
          cached && cached.expiresAt - now > ATTACHMENT_URL_REFRESH_BUFFER
            ? cached.url
            : null;

        if (!signedUrl) {
          const { data: signedData, error: signedError } =
            await supabaseCompany.storage
              .from(MESSAGE_ATTACHMENT_BUCKET)
              .createSignedUrl(row.file_path, ATTACHMENT_URL_EXPIRY);

          if (signedError) {
            console.error(
              "[Company Messages] Signed URL error:",
              row.file_name,
              signedError
            );
          } else if (signedData?.signedUrl) {
            signedUrl = signedData.signedUrl;

            attachmentUrlCache.set(cacheKey, {
              url: signedUrl,
              expiresAt: now + ATTACHMENT_URL_EXPIRY * 1000,
            });
          }
        }

        attachmentMap[row.message_id].push({
          id: row.id,
          fileName: row.file_name,
          filePath: row.file_path,
          fileType: row.file_type || "application/octet-stream",
          fileSize: Number(row.file_size) || 0,
          createdAt: row.created_at,
          url: signedUrl,
        });
      })
    );

    return attachmentMap;
  }, []);
  // =========================================================
  // AUTH
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseCompany.auth.getUser();

        if (error) throw error;

        if (mounted) {
          setCurrentUser(user || null);
        }
      } catch (error) {
        console.error("[Company Messages] Auth error:", error);

        if (mounted) {
          setCurrentUser(null);
          setContactsLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // LOAD COMPANY MESSAGE CONTACTS
  // =========================================================

  useEffect(() => {
    if (!currentUser?.id) return;

    let mounted = true;

    const loadContacts = async () => {
      setContactsLoading(true);

      try {
        const { data, error } = await supabaseCompany.rpc(
          "get_company_message_contacts"
        );

        if (error) throw error;

        const companyContacts = (data || []).map((student) => ({
          id: student.id,
          name: buildName(student),
          role: "Intern",
          roleValue: "student",
          status: student.status || "active",
          contactType: "student",
          profilePhotoUrl: getProfilePhotoUrl(student.profile_photo_url),
          unread: 0,
        }));

        if (!mounted) return;

        setContacts(companyContacts);

        setSelectedContact((previousSelected) => {
          if (
            previousSelected &&
            companyContacts.some(
              (contact) => contact.id === previousSelected.id
            )
          ) {
            return (
              companyContacts.find(
                (contact) => contact.id === previousSelected.id
              ) || null
            );
          }

          return companyContacts[0] || null;
        });
      } catch (error) {
        console.error("[Company Messages] Contact RPC error:", error);

        if (mounted) {
          setContacts([]);
          setSelectedContact(null);
          setUnreadByContact({});
        }
      } finally {
        if (mounted) {
          setContactsLoading(false);
        }
      }
    };

    loadContacts();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  // =========================================================
  // GET OR CREATE DIRECT CONVERSATION
  // =========================================================

  const getOrCreateDirectConversation = async (otherUserId) => {
    if (!otherUserId) {
      throw new Error("A valid contact is required.");
    }

    const { data: conversationId, error: conversationError } =
      await supabaseCompany.rpc("create_direct_conversation", {
        p_other_user_id: otherUserId,
      });

    if (conversationError) {
      console.error(
        "[Company Messages] Create conversation error:",
        conversationError
      );

      throw conversationError;
    }

    if (!conversationId) {
      throw new Error("Conversation could not be created.");
    }

    const { data: conversation, error: fetchConversationError } =
      await supabaseCompany
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

    if (fetchConversationError) {
      console.error(
        "[Company Messages] Fetch conversation error:",
        fetchConversationError
      );

      throw fetchConversationError;
    }

    if (!conversation) {
      throw new Error("Conversation could not be found.");
    }

    return conversation;
  };

  // =========================================================
  // LOAD REACTIONS
  // =========================================================

  const loadReactionsForMessages = useCallback(
    async (messageRows) => {
      const messageIds = (messageRows || [])
        .map((message) => message.id)
        .filter(Boolean);

      if (!messageIds.length) return {};

      const { data: reactionRows, error } = await supabaseCompany
        .from("message_reactions")
        .select("id, message_id, user_id, reaction, created_at")
        .in("message_id", messageIds);

      if (error) throw error;

      const userIds = [
        ...new Set(
          (reactionRows || []).map((row) => row.user_id).filter(Boolean)
        ),
      ];

      let userNames = {};

      if (userIds.length) {
        const { data: users, error: usersError } = await supabaseCompany
          .from("users")
          .select("id, first_name, middle_name, last_name")
          .in("id", userIds);

        if (usersError) {
          console.warn(
            "[Company Messages] Reaction participant names unavailable:",
            usersError
          );
        } else {
          userNames = Object.fromEntries(
            (users || []).map((user) => [
              user.id,
              [user.first_name, user.middle_name, user.last_name]
                .filter(Boolean)
                .join(" ")
                .trim() || "Participant",
            ])
          );
        }
      }

      const result = {};

      (reactionRows || []).forEach((row) => {
        if (!result[row.message_id]) result[row.message_id] = [];

        result[row.message_id].push({
          id: row.id,
          userId: row.user_id,
          value: row.reaction,
          emoji:
            MESSAGE_REACTIONS.find((item) => item.value === row.reaction)
              ?.emoji || "👍",
          participantName:
            row.user_id === currentUser?.id
              ? "You"
              : userNames[row.user_id] || "Participant",
        });
      });

      return result;
    },
    [currentUser?.id]
  );

  // =========================================================
  // LOAD MESSAGES + REALTIME
  // =========================================================

  useEffect(() => {
    if (!currentUser?.id || !selectedContact?.id) return;

    let mounted = true;
    let realtimeChannel = null;
    let syncInterval = null;

    const contactId = selectedContact.id;

    const loadMessages = async () => {
      try {
        let conversation = conversationsRef.current[contactId];

        if (!conversation) {
          conversation = await getOrCreateDirectConversation(contactId);

          if (!mounted) return;

          conversationsRef.current = {
            ...conversationsRef.current,
            [contactId]: conversation,
          };

          setConversations(conversationsRef.current);
        }

        const { data, error } = await supabaseCompany
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", {
            ascending: true,
          });

        if (error) throw error;

        let attachmentMap = {};
        let reactionMap = {};

        try {
          attachmentMap = await loadAttachmentsForMessages(data || []);
        } catch (attachmentError) {
          console.error(
            "[Company Messages] Could not load attachment history:",
            attachmentError
          );
        }

        try {
          reactionMap = await loadReactionsForMessages(data || []);
        } catch (reactionError) {
          console.error(
            "[Company Messages] Could not load reactions:",
            reactionError
          );
        }

        if (!mounted) return;

        const normalizedMessages = (data || [])
          .map((message) => ({
            ...normalizeMessage(message),
            attachments: attachmentMap[message.id] || [],
            reactions: reactionMap[message.id] || [],
          }))
          .filter(Boolean);

        setMessages((previous) => ({
          ...previous,
          [contactId]: normalizedMessages,
        }));

        const incomingRows = (data || []).filter(
          (row) => row.sender_id !== currentUser.id
        );

        await Promise.all(
          incomingRows.map((row) => markMessageDelivered(row.id))
        );

        const latestLoadedMessage = (data || []).at(-1);

        if (latestLoadedMessage) {
          await markConversationSeen(conversation.id, latestLoadedMessage.id);
        }

        await refreshOutgoingMessageStatuses(conversation.id, contactId);

        // The open conversation has now been marked read.
        void refreshUnreadCounts();

        console.log("[Company Messages] Messages loaded:", {
          contactId,
          conversationId: conversation.id,
          count: normalizedMessages.length,
        });

        realtimeChannel = supabaseCompany
          .channel(`company-messages-${conversation.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversation.id}`,
            },
            (payload) => {
              if (!mounted || !payload?.new) return;

              const incomingMessage = {
                ...normalizeMessage(payload.new),
                attachments: [],
                reactions: [],
              };

              if (!incomingMessage) return;

              if (incomingMessage.senderId !== currentUser.id) {
                void markMessageDelivered(incomingMessage.id);
                void markConversationSeen(conversation.id, incomingMessage.id);
                void refreshUnreadCounts();
              } else {
                void refreshOutgoingMessageStatuses(conversation.id, contactId);
              }

              setMessages((previous) => {
                const existing = previous[contactId] || [];

                if (
                  existing.some((message) => message.id === incomingMessage.id)
                ) {
                  return previous;
                }

                return {
                  ...previous,
                  [contactId]: [...existing, incomingMessage],
                };
              });
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
              if (!mounted || !payload?.new?.id) return;

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
              event: "INSERT",
              schema: "public",
              table: "message_attachments",
            },
            async (payload) => {
              if (!mounted || !payload?.new?.message_id) {
                return;
              }

              const { data: messageRow, error: lookupError } =
                await supabaseCompany
                  .from("messages")
                  .select("id, conversation_id")
                  .eq("id", payload.new.message_id)
                  .eq("conversation_id", conversation.id)
                  .maybeSingle();

              if (lookupError) {
                console.error(
                  "[Company Messages] Attachment lookup error:",
                  lookupError
                );
                return;
              }

              if (!mounted || !messageRow) return;

              try {
                const map = await loadAttachmentsForMessages([messageRow]);

                if (!mounted) return;

                const newAttachments = map[messageRow.id] || [];

                setMessages((previous) => {
                  const existing = previous[contactId] || [];

                  return {
                    ...previous,
                    [contactId]: existing.map((message) => {
                      if (message.id !== messageRow.id) {
                        return message;
                      }

                      const merged = [...(message.attachments || [])];

                      newAttachments.forEach((attachment) => {
                        if (!merged.some((item) => item.id === attachment.id)) {
                          merged.push(attachment);
                        }
                      });

                      return {
                        ...message,
                        attachments: merged,
                      };
                    }),
                  };
                });
              } catch (error) {
                console.error(
                  "[Company Messages] Could not display realtime attachment:",
                  error
                );
              }
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

              const changedMessageId =
                payload?.new?.message_id || payload?.old?.message_id;

              if (changedMessageId) {
                const belongsToConversation = (
                  messagesRef.current[contactId] || []
                ).some((item) => item.id === changedMessageId);

                if (!belongsToConversation) return;
              }

              try {
                const visibleRows = (messagesRef.current[contactId] || []).map(
                  (item) => ({ id: item.id })
                );

                if (!visibleRows.length) return;

                const reactionMap = await loadReactionsForMessages(visibleRows);

                if (!mounted) return;

                setMessages((previous) => ({
                  ...previous,
                  [contactId]: (previous[contactId] || []).map((item) => ({
                    ...item,
                    reactions: reactionMap[item.id] || [],
                  })),
                }));
              } catch (error) {
                console.error(
                  "[Company Messages] Realtime reaction refresh failed:",
                  error
                );
              }
            }
          )
          .subscribe((status) => {
            console.log("[Company Messages] Realtime status:", status);
          });

        // Reconcile periodically in case realtime misses an event.
        const syncMessages = async () => {
          try {
            const { data: latestRows, error: latestError } =
              await supabaseCompany
                .from("messages")
                .select("*")
                .eq("conversation_id", conversation.id)
                .order("created_at", { ascending: true });

            if (latestError) throw latestError;
            if (!mounted) return;

            let latestAttachments = {};
            let latestReactions = {};

            try {
              latestAttachments = await loadAttachmentsForMessages(
                latestRows || []
              );
            } catch (error) {
              console.error(
                "[Company Messages] Poll attachment sync error:",
                error
              );
            }

            try {
              latestReactions = await loadReactionsForMessages(
                latestRows || []
              );
            } catch (error) {
              console.error(
                "[Company Messages] Poll reaction sync error:",
                error
              );
            }

            if (!mounted) return;

            const latest = (latestRows || []).map((row) => ({
              ...normalizeMessage(row),
              attachments: latestAttachments[row.id] || [],
              reactions: latestReactions[row.id] || [],
            }));

            setMessages((previous) => {
              const existing = previous[contactId] || [];
              const byId = new Map(
                existing.map((message) => [message.id, message])
              );

              const merged = latest.map((message) => {
                const old = byId.get(message.id);

                return {
                  ...old,
                  ...message,
                  status:
                    old?.status &&
                    ({ sent: 0, delivered: 1, seen: 2 }[old.status] ?? 0) >
                      ({ sent: 0, delivered: 1, seen: 2 }[message.status] ?? 0)
                      ? old.status
                      : message.status,
                  deliveredAt: old?.deliveredAt || message.deliveredAt || null,
                  seenAt: old?.seenAt || message.seenAt || null,
                  attachments: message.attachments.length
                    ? message.attachments
                    : old?.attachments || [],
                  reactions: Object.prototype.hasOwnProperty.call(
                    latestReactions,
                    message.id
                  )
                    ? message.reactions
                    : old?.reactions || [],
                };
              });

              return { ...previous, [contactId]: merged };
            });

            const incomingFreshRows = (latestRows || []).filter(
              (row) => row.sender_id !== currentUser.id
            );

            await Promise.all(
              incomingFreshRows.map((row) => markMessageDelivered(row.id))
            );

            const latestFreshMessage = (latestRows || []).at(-1);

            if (latestFreshMessage) {
              await markConversationSeen(
                conversation.id,
                latestFreshMessage.id
              );
            }

            await refreshOutgoingMessageStatuses(conversation.id, contactId);

            void refreshUnreadCounts();
          } catch (error) {
            console.error(
              "[Company Messages] Periodic message sync error:",
              error
            );
          }
        };

        syncInterval = setInterval(syncMessages, 1500);
      } catch (error) {
        console.error("[Company Messages] Conversation/message error:", error);

        if (mounted) {
          setMessages((previous) => ({
            ...previous,
            [contactId]: [],
          }));
        }
      }
    };

    loadMessages();

    return () => {
      mounted = false;

      if (syncInterval) clearInterval(syncInterval);

      if (realtimeChannel) {
        void supabaseCompany.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  }, [
    currentUser?.id,
    selectedContact?.id,
    normalizeMessage,
    loadAttachmentsForMessages,
    loadReactionsForMessages,
  ]);

  // =========================================================
  // FILTERED CONTACTS + CURRENT MESSAGES
  // =========================================================

  const filteredContacts = contacts.filter((contact) =>
    `${contact.name} ${contact.role}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedContact
    ? messages[selectedContact.id] || []
    : [];

  // =========================================================
  // SCROLL TO LATEST MESSAGE
  // =========================================================

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [currentMessages.length, selectedContact?.id]);

  // =========================================================
  // SELECT CONTACT
  // =========================================================

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setMessageInput("");
    setSelectedFiles([]);
    setAttachmentError("");
    setMessageActionError("");
    setEditingMessageId(null);
    setEditMessageInput("");

    // Clear the selected contact's badge optimistically.
    setUnreadByContact((previous) => ({
      ...previous,
      [contact.id]: 0,
    }));
  };

  // =========================================================
  // SELECT FILES
  // =========================================================

  const handleFileSelection = (event) => {
    const incomingFiles = Array.from(event.target.files || []);

    // Allow selecting the same file again later.
    event.target.value = "";

    if (!incomingFiles.length) return;

    setAttachmentError("");

    setSelectedFiles((previous) => {
      const nextFiles = [...previous];

      for (const file of incomingFiles) {
        if (nextFiles.length >= MAX_FILES) {
          setAttachmentError(
            `You can attach up to ${MAX_FILES} files per message.`
          );
          break;
        }

        if (file.size > MAX_FILE_SIZE) {
          setAttachmentError(`${file.name} exceeds the 10 MB per-file limit.`);
          continue;
        }

        const duplicate = nextFiles.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (!duplicate) {
          nextFiles.push(file);
        }
      }

      return nextFiles;
    });
  };

  // =========================================================
  // SEND MESSAGE + FILE ATTACHMENTS
  // =========================================================

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!selectedContact || !currentUser?.id || uploading) {
      return;
    }

    const trimmedMessage = messageInput.trim();
    const filesToSend = [...selectedFiles];

    // Allow attachment-only messages.
    if (!trimmedMessage && !filesToSend.length) return;

    setUploading(true);
    setAttachmentError("");

    try {
      let conversation = conversationsRef.current[selectedContact.id];

      if (!conversation) {
        conversation = await getOrCreateDirectConversation(selectedContact.id);

        conversationsRef.current = {
          ...conversationsRef.current,
          [selectedContact.id]: conversation,
        };

        setConversations(conversationsRef.current);
      }

      // Create the message first to get its UUID for the Storage path.
      const { data: sendResult, error: sendError } = await supabaseCompany.rpc(
        "send_message",
        {
          p_conversation_id: conversation.id,
          p_content: trimmedMessage || null,
          p_reply_to_message_id: null,
        }
      );

      if (sendError) throw sendError;

      const sentMessage = Array.isArray(sendResult)
        ? sendResult[0]
        : sendResult;

      if (!sentMessage?.id) {
        throw new Error("The message was sent without returning a message ID.");
      }

      setMessageInput("");
      setSelectedFiles([]);

      // Add the sent message locally; realtime duplicate checks remain active.
      const normalizedSentMessage = normalizeMessage({
        ...sentMessage,
        content: trimmedMessage || null,
      });

      setMessages((previous) => {
        const existing = previous[selectedContact.id] || [];

        if (existing.some((message) => message.id === sentMessage.id)) {
          return previous;
        }

        return {
          ...previous,
          [selectedContact.id]: [...existing, normalizedSentMessage],
        };
      });

      const failures = [];

      for (const file of filesToSend) {
        const safeName = file.name.replace(/[^\w.\-() ]/g, "_");

        const uniqueName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}-${safeName}`;

        // Storage path: user ID / conversation ID / message ID / filename.
        const filePath = `${currentUser.id}/${conversation.id}/${sentMessage.id}/${uniqueName}`;

        // 1. Upload the actual file to private Storage.
        const { error: uploadError } = await supabaseCompany.storage
          .from(MESSAGE_ATTACHMENT_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error("[Company Messages] File upload failed:", uploadError);

          failures.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        // 2. Register the attachment using the existing RPC.
        const { data: attachmentResult, error: metadataError } =
          await supabaseCompany.rpc("add_message_attachment", {
            p_message_id: sentMessage.id,
            p_file_name: file.name,
            p_file_path: filePath,
            p_file_type: file.type || "application/octet-stream",
            p_file_size: file.size,
          });

        if (metadataError) {
          console.error(
            "[Company Messages] Saving attachment metadata failed:",
            metadataError
          );

          failures.push(
            `${file.name} uploaded, but its attachment record could not be saved: ${metadataError.message}`
          );

          continue;
        }

        const savedAttachment = Array.isArray(attachmentResult)
          ? attachmentResult[0]
          : attachmentResult;

        // 3. Generate a temporary URL for viewing.
        const { data: signedData, error: signedError } =
          await supabaseCompany.storage
            .from(MESSAGE_ATTACHMENT_BUCKET)
            .createSignedUrl(filePath, ATTACHMENT_URL_EXPIRY);

        if (signedError) {
          console.error(
            "[Company Messages] Could not create signed URL:",
            signedError
          );
        }

        const attachment = {
          id: savedAttachment?.id || `${sentMessage.id}-${filePath}`,
          fileName: savedAttachment?.file_name || file.name,
          filePath,
          fileType:
            savedAttachment?.file_type ||
            file.type ||
            "application/octet-stream",
          fileSize: Number(savedAttachment?.file_size ?? file.size),
          createdAt: savedAttachment?.created_at || new Date().toISOString(),
          url: signedData?.signedUrl || null,
        };

        // 4. Display the new attachment immediately.
        setMessages((previous) => {
          const existing = previous[selectedContact.id] || [];

          const foundMessage = existing.some(
            (message) => message.id === sentMessage.id
          );

          if (!foundMessage) {
            return {
              ...previous,
              [selectedContact.id]: [
                ...existing,
                {
                  ...normalizedSentMessage,
                  attachments: [attachment],
                },
              ],
            };
          }

          return {
            ...previous,
            [selectedContact.id]: existing.map((message) => {
              if (message.id !== sentMessage.id) {
                return message;
              }

              const existingAttachments = message.attachments || [];

              if (
                existingAttachments.some((item) => item.id === attachment.id)
              ) {
                return message;
              }

              return {
                ...message,
                attachments: [...existingAttachments, attachment],
              };
            }),
          };
        });
      }

      if (failures.length) {
        setAttachmentError(
          `Your message was sent, but some files could not be attached:\n${failures.join(
            "\n"
          )}`
        );
      }
    } catch (error) {
      console.error("[Company Messages] Send error:", error);

      setAttachmentError(
        error?.message || "Failed to send your message. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // EDIT / DELETE / REACT TO MESSAGES
  // =========================================================

  const startEditingMessage = (message) => {
    if (!message || message.sender !== "sent" || message.isDeleted) return;

    setMessageActionError("");
    setEditingMessageId(message.id);
    setEditMessageInput(message.text || "");
  };

  const handleEditMessage = async (messageId) => {
    const content = editMessageInput.trim();

    if (!content) {
      setMessageActionError("A message cannot be empty.");
      return;
    }

    setMessageActionBusy(true);
    setMessageActionError("");

    try {
      const { error } = await supabaseCompany.rpc("edit_message", {
        p_message_id: messageId,
        p_content: content,
      });

      if (error) throw error;

      const { data, error: fetchError } = await supabaseCompany
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        const updated = normalizeMessage(data);

        setMessages((previous) => ({
          ...previous,
          [selectedContact.id]: (previous[selectedContact.id] || []).map(
            (message) =>
              message.id === messageId
                ? {
                    ...message,
                    ...updated,
                    attachments: message.attachments || [],
                  }
                : message
          ),
        }));
      }

      setEditingMessageId(null);
      setEditMessageInput("");
    } catch (error) {
      console.error("[Company Messages] Edit message error:", error);

      setMessageActionError(error?.message || "Could not edit this message.");
    } finally {
      setMessageActionBusy(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    setMessageActionBusy(true);
    setMessageActionError("");

    try {
      const { error } = await supabaseCompany.rpc("delete_message", {
        p_message_id: messageId,
      });

      if (error) throw error;

      const { data, error: fetchError } = await supabaseCompany
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        const updated = normalizeMessage(data);

        setMessages((previous) => ({
          ...previous,
          [selectedContact.id]: (previous[selectedContact.id] || []).map(
            (message) =>
              message.id === messageId
                ? {
                    ...message,
                    ...updated,
                    attachments: message.attachments || [],
                  }
                : message
          ),
        }));
      }

      void refreshUnreadCounts();
    } catch (error) {
      console.error("[Company Messages] Delete message error:", error);

      setMessageActionError(error?.message || "Could not delete this message.");
    } finally {
      setMessageActionBusy(false);
    }
  };

  const handleMessageReaction = async (messageId, reaction) => {
    if (!currentUser?.id || messageActionBusy) return;

    setMessageActionError("");

    const message = (messages[selectedContact?.id] || []).find(
      (item) => item.id === messageId
    );

    const currentReaction = (message?.reactions || []).find(
      (item) => item.userId === currentUser.id
    );

    setMessageActionBusy(true);

    try {
      const result =
        currentReaction?.value === reaction
          ? await supabaseCompany.rpc("remove_message_reaction", {
              p_message_id: messageId,
            })
          : await supabaseCompany.rpc("set_message_reaction", {
              p_message_id: messageId,
              p_reaction: reaction,
            });

      if (result.error) throw result.error;

      const visibleRows = (messages[selectedContact?.id] || []).map((item) => ({
        id: item.id,
      }));

      const reactionMap = await loadReactionsForMessages(visibleRows);

      setMessages((previous) => ({
        ...previous,
        [selectedContact.id]: (previous[selectedContact.id] || []).map(
          (item) => ({
            ...item,
            reactions: reactionMap[item.id] || [],
          })
        ),
      }));
    } catch (error) {
      console.error("[Company Messages] Reaction error:", error);

      setMessageActionError(error?.message || "Could not update reaction.");
    } finally {
      setMessageActionBusy(false);
    }
  };

  // =========================================================
  // RENDER AVATAR
  // =========================================================

  const renderAvatar = (contact, sizeClass = "w-10 h-10", active = false) => (
    <div
      className={`${sizeClass} flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold ${getAvatarClass(
        active
      )}`}
    >
      {contact?.profilePhotoUrl ? (
        <img
          src={contact.profilePhotoUrl}
          alt={contact.name || "Student"}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        getInitials(contact?.name)
      )}
    </div>
  );

  // =========================================================
  // UNREAD BADGE
  // =========================================================

  const renderUnreadBadge = (contact, active = false) => {
    const count = unreadByContact[contact.id] || 0;

    if (count <= 0) return null;

    return (
      <span
        className={`ml-1 flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
          active ? "bg-white text-slate-900" : "bg-blue-600 text-white"
        }`}
        aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
        title={`${count} unread message${count === 1 ? "" : "s"}`}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8 bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        {/* PAGE HEADER */}

        <div className="mb-4 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Company Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Messages
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            Communicate with your assigned interns and registrar.
          </p>
        </div>

        {/* MAIN MESSAGES CONTAINER */}

        <section
          className={`w-full border rounded-xl overflow-hidden shadow-sm ${mainContainerClass}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] min-h-0 md:h-[calc(100vh-220px)] md:max-h-[760px]">
            {/* DESKTOP CONTACT SIDEBAR */}

            <aside
              className={`hidden md:flex flex-col min-h-0 border-r ${panelClass}`}
            >
              <div className={`p-4 border-b flex-shrink-0 ${panelClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-sm font-bold ${headingClass}`}>Inbox</h2>

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
                      Loading interns...
                    </p>
                  </div>
                ) : filteredContacts.length > 0 ? (
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
                          {renderAvatar(contact, "w-10 h-10", active)}

                          <div className="min-w-0 flex-1">
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

                          {renderUnreadBadge(contact, active)}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center px-3">
                    <p className={`text-xs ${mutedClass}`}>
                      No accepted interns yet.
                    </p>

                    <p
                      className={`text-[10px] mt-1 leading-relaxed ${mutedClass}`}
                    >
                      Students will appear here after they accept their
                      internship assignment.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* MOBILE CONTACT BAR */}

            <div className={`md:hidden border-b ${panelClass}`}>
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-bold ${headingClass}`}>
                      Inbox
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
                      Loading interns...
                    </p>
                  </div>
                ) : filteredContacts.length > 0 ? (
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
                          {renderAvatar(contact, "w-9 h-9", active)}

                          <div className="min-w-0 flex-1">
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

                          {renderUnreadBadge(contact, active)}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="w-full py-4 text-center">
                    <p className={`text-xs ${mutedClass}`}>
                      No accepted interns yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CHAT AREA */}

            <div
              className={`flex flex-col min-w-0 min-h-0 h-[500px] sm:h-[550px] md:h-auto ${chatClass}`}
            >
              {selectedContact ? (
                <>
                  {/* CHAT HEADER */}

                  <div
                    className={`h-[64px] sm:h-[72px] px-4 sm:px-5 border-b flex items-center justify-between flex-shrink-0 ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderAvatar(selectedContact, "w-10 h-10", true)}

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
                  </div>

                  {/* MESSAGE HISTORY */}

                  <div
                    ref={messagesContainerRef}
                    className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 overscroll-contain ${chatClass}`}
                  >
                    <div className="space-y-4">
                      {currentMessages.length > 0 ? (
                        currentMessages.map((message) => {
                          const isSent = message.sender === "sent";

                          const hasAttachments =
                            !message.isDeleted &&
                            (message.attachments || []).length > 0;

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
                                {(message.isDeleted ||
                                  message.text ||
                                  hasAttachments) && (
                                  <div
                                    className={`max-w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                                      isSent
                                        ? "bg-slate-800 text-white rounded-br-sm"
                                        : darkMode
                                        ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm"
                                        : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-sm"
                                    }`}
                                  >
                                    {message.isDeleted ? (
                                      <div className="italic opacity-70">
                                        This message was deleted.
                                      </div>
                                    ) : editingMessageId === message.id ? (
                                      <div className="min-w-[220px] space-y-2">
                                        <textarea
                                          value={editMessageInput}
                                          onChange={(event) =>
                                            setEditMessageInput(
                                              event.target.value
                                            )
                                          }
                                          rows={3}
                                          maxLength={5000}
                                          className={`w-full rounded-md border p-2 text-xs outline-none ${inputClass}`}
                                          autoFocus
                                        />

                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            disabled={messageActionBusy}
                                            onClick={() =>
                                              handleEditMessage(message.id)
                                            }
                                            className="rounded-md bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-900 disabled:opacity-50"
                                          >
                                            {messageActionBusy
                                              ? "Saving…"
                                              : "Save"}
                                          </button>

                                          <button
                                            type="button"
                                            disabled={messageActionBusy}
                                            onClick={() => {
                                              setEditingMessageId(null);
                                              setEditMessageInput("");
                                            }}
                                            className="rounded-md border border-white/30 px-2.5 py-1.5 text-[10px] font-semibold disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        {message.text && (
                                          <div>{message.text}</div>
                                        )}

                                        {!message.isDeleted && (
                                          <MessageAttachments
                                            attachments={
                                              message.attachments || []
                                            }
                                            darkMode={darkMode}
                                            formatFileSize={formatFileSize}
                                          />
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}

                                {!message.isDeleted && (
                                  <div
                                    className={`mt-1 flex flex-wrap items-center gap-1 px-1 ${
                                      isSent ? "justify-end" : "justify-start"
                                    }`}
                                  >
                                    {MESSAGE_REACTIONS.map((reaction) => {
                                      const matching = (
                                        message.reactions || []
                                      ).filter(
                                        (item) => item.value === reaction.value
                                      );

                                      const mine = matching.some(
                                        (item) =>
                                          item.userId === currentUser?.id
                                      );

                                      const names = matching
                                        .map((item) => item.participantName)
                                        .filter(Boolean)
                                        .join(", ");

                                      return (
                                        <button
                                          key={reaction.value}
                                          type="button"
                                          title={
                                            matching.length
                                              ? `${reaction.label}: ${
                                                  names ||
                                                  matching.length +
                                                    " reaction(s)"
                                                }. Click to ${
                                                  mine ? "remove" : "change/add"
                                                } your reaction.`
                                              : `React ${reaction.label}`
                                          }
                                          aria-label={`React ${reaction.label}${
                                            matching.length
                                              ? `, ${matching.length} reaction${
                                                  matching.length === 1
                                                    ? ""
                                                    : "s"
                                                }`
                                              : ""
                                          }`}
                                          onClick={() =>
                                            handleMessageReaction(
                                              message.id,
                                              reaction.value
                                            )
                                          }
                                          className={`rounded-full border px-1.5 py-0.5 text-[11px] transition disabled:opacity-50 ${
                                            mine
                                              ? "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/30"
                                              : darkMode
                                              ? "border-slate-700 hover:bg-slate-800"
                                              : "border-slate-200 hover:bg-slate-100"
                                          }`}
                                          disabled={messageActionBusy}
                                        >
                                          {reaction.emoji}
                                        </button>
                                      );
                                    })}

                                    {isSent && (
                                      <>
                                        <button
                                          type="button"
                                          disabled={messageActionBusy}
                                          onClick={() =>
                                            startEditingMessage(message)
                                          }
                                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${mutedClass} hover:text-blue-500 disabled:opacity-40`}
                                        >
                                          Edit
                                        </button>

                                        <button
                                          type="button"
                                          disabled={messageActionBusy}
                                          onClick={() =>
                                            handleDeleteMessage(message.id)
                                          }
                                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}

                                {(() => {
                                  const groupedReactions =
                                    MESSAGE_REACTIONS.map((reaction) => ({
                                      ...reaction,
                                      count: (message.reactions || []).filter(
                                        (item) => item.value === reaction.value
                                      ).length,
                                      mine: (message.reactions || []).some(
                                        (item) =>
                                          item.value === reaction.value &&
                                          item.userId === currentUser?.id
                                      ),
                                      names: (message.reactions || [])
                                        .filter(
                                          (item) =>
                                            item.value === reaction.value
                                        )
                                        .map((item) => item.participantName)
                                        .filter(Boolean)
                                        .join(", "),
                                    })).filter(
                                      (reaction) => reaction.count > 0
                                    );

                                  return groupedReactions.length > 0 &&
                                    !message.isDeleted ? (
                                    <div
                                      className={`mt-0.5 flex flex-wrap gap-1 px-1 ${
                                        isSent ? "justify-end" : "justify-start"
                                      }`}
                                    >
                                      {groupedReactions.map((reaction) => (
                                        <button
                                          key={reaction.value}
                                          type="button"
                                          onClick={() =>
                                            handleMessageReaction(
                                              message.id,
                                              reaction.value
                                            )
                                          }
                                          disabled={messageActionBusy}
                                          title={`${reaction.label}: ${
                                            reaction.names ||
                                            reaction.count + " reaction(s)"
                                          }`}
                                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition disabled:opacity-50 ${
                                            reaction.mine
                                              ? "border-blue-400 bg-blue-500/20"
                                              : darkMode
                                              ? "border-slate-700 bg-slate-800"
                                              : "border-slate-200 bg-slate-50"
                                          }`}
                                        >
                                          <span>{reaction.emoji}</span>
                                          <span>{reaction.count}</span>
                                        </button>
                                      ))}
                                    </div>
                                  ) : null;
                                })()}

                                <div
                                  className={`mt-1 flex items-center gap-1 px-1 text-[9px] ${mutedClass} ${
                                    isSent ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  <span>
                                    {message.time}
                                    {message.isEdited && !message.isDeleted
                                      ? " · edited"
                                      : ""}
                                  </span>
                                </div>

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
                            No messages yet.
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
                    {/* SELECTED FILES */}

                    {selectedFiles.length > 0 && (
                      <div
                        className={`mb-3 rounded-lg border p-2.5 ${
                          darkMode
                            ? "border-slate-700 bg-slate-800"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p
                            className={`text-[11px] font-bold ${headingClass}`}
                          >
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
                                    previous.filter(
                                      (_, fileIndex) => fileIndex !== index
                                    )
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

                    {messageActionError && (
                      <div
                        role="alert"
                        className="mb-3 whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-700"
                      >
                        {messageActionError}
                      </div>
                    )}

                    {/* ATTACHMENT ERRORS */}

                    {attachmentError && (
                      <div
                        role="alert"
                        className="mb-3 whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-700"
                      >
                        {attachmentError}
                      </div>
                    )}

                    {/* HIDDEN FILE PICKER */}

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelection}
                    />

                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-center gap-2"
                    >
                      {/* ATTACHMENT BUTTON */}

                      <button
                        type="button"
                        disabled={
                          uploading || selectedFiles.length >= MAX_FILES
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

                      {/* MESSAGE INPUT */}

                      <input
                        type="text"
                        value={messageInput}
                        onChange={(event) =>
                          setMessageInput(event.target.value)
                        }
                        placeholder={`Message ${selectedContact.name}...`}
                        autoComplete="off"
                        disabled={uploading}
                        className={`flex-1 min-w-0 h-11 px-3 sm:px-4 rounded-lg border text-xs outline-none transition disabled:opacity-50 ${inputClass}`}
                      />

                      {/* SEND BUTTON */}

                      <button
                        type="submit"
                        disabled={
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
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center max-w-sm">
                    <div
                      className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-xl ${
                        darkMode
                          ? "bg-slate-800 text-slate-400"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      💬
                    </div>

                    <h2 className={`text-sm font-bold mt-4 ${headingClass}`}>
                      No interns to message
                    </h2>

                    <p className={`text-xs mt-2 leading-relaxed ${mutedClass}`}>
                      Students will appear here after they accept their
                      internship assignment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Messages;
