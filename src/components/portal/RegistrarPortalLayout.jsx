import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

// =========================================================
// COMPONENT
// =========================================================

const RegistrarPortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // REGISTRAR PROFILE
  // =========================================================

  const [registrarProfile, setRegistrarProfile] = useState({
    id: null,
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    employee_id: "",
    department: "",
    position: "",
    specialization: "",
    phone: "",
    address: "",
    profile_photo_url: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  // =========================================================
  // LOAD CURRENT REGISTRAR PROFILE
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const loadRegistrarProfile = async () => {
      try {
        setProfileLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabaseRegistrar.auth.getUser();

        if (authError) {
          console.error("Error getting authenticated user:", authError);
          return;
        }

        if (!user) {
          console.warn("No authenticated user found.");
          return;
        }

        const { data: userData, error: userError } = await supabaseRegistrar
          .from("users")
          .select(
            `
                id,
                email,
                first_name,
                middle_name,
                last_name,
                role,
                status
              `
          )
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Error loading users record:", userError);
        }

        const { data: registrarData, error: registrarError } =
          await supabaseRegistrar
            .from("registrars")
            .select(
              `
                id,
                employee_id,
                department,
                position,
                specialization,
                phone,
                address,
                profile_photo_url
              `
            )
            .eq("id", user.id)
            .single();

        if (registrarError) {
          console.error("Error loading registrar record:", registrarError);
        }

        if (!isMounted) return;

        setRegistrarProfile({
          id: user.id,
          first_name: userData?.first_name || "",
          middle_name: userData?.middle_name || "",
          last_name: userData?.last_name || "",
          email: userData?.email || user.email || "",
          employee_id: registrarData?.employee_id || "",
          department: registrarData?.department || "",
          position: registrarData?.position || "",
          specialization: registrarData?.specialization || "",
          phone: registrarData?.phone || "",
          address: registrarData?.address || "",
          profile_photo_url: registrarData?.profile_photo_url || "",
        });
      } catch (error) {
        console.error("Unexpected error loading registrar profile:", error);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    loadRegistrarProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================
  // REGISTRAR DISPLAY NAME AND INITIALS
  // =========================================================

  const getRegistrarFullName = () => {
    const firstName = registrarProfile.first_name?.trim() || "";
    const middleName = registrarProfile.middle_name?.trim() || "";
    const lastName = registrarProfile.last_name?.trim() || "";

    return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  };

  const registrarFullName = getRegistrarFullName() || "Registrar Admin";

  const getRegistrarInitials = () => {
    const firstName = registrarProfile.first_name?.trim() || "";
    const lastName = registrarProfile.last_name?.trim() || "";

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (lastName) return lastName.substring(0, 2).toUpperCase();

    return "RA";
  };

  const registrarInitials = getRegistrarInitials();

  // =========================================================
  // PROFILE PHOTO URL
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const loadProfilePhoto = async () => {
      const photoPath = registrarProfile.profile_photo_url;

      if (!photoPath) {
        if (isMounted) setProfilePhotoUrl("");
        return;
      }

      try {
        if (
          photoPath.startsWith("http://") ||
          photoPath.startsWith("https://")
        ) {
          if (isMounted) setProfilePhotoUrl(photoPath);
          return;
        }

        const { data, error } = await supabaseRegistrar.storage
          .from("profile-photos")
          .createSignedUrl(photoPath, 60 * 60);

        if (error) {
          console.error("Error generating profile photo URL:", error);
          if (isMounted) setProfilePhotoUrl("");
          return;
        }

        if (isMounted) setProfilePhotoUrl(data?.signedUrl || "");
      } catch (error) {
        console.error("Unexpected profile photo error:", error);
        if (isMounted) setProfilePhotoUrl("");
      }
    };

    loadProfilePhoto();

    return () => {
      isMounted = false;
    };
  }, [registrarProfile.profile_photo_url]);

  // =========================================================
  // LOGOUT PLACEHOLDER
  // =========================================================

  // const logout = (...args) => {
  //   void args;
  // };

  // =========================================================
  // SIDEBAR
  // =========================================================

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // =========================================================
  // PROFILE AND NOTIFICATION DROPDOWNS
  // =========================================================

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  // =========================================================
  // NOTIFICATION STATE
  // =========================================================

  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // =========================================================
  // MESSAGES UNREAD STATE
  // =========================================================

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // =========================================================
  // UNREAD MESSAGE CHECK
  // Realtime updates + polling fallback
  // =========================================================

  useEffect(() => {
    let isMounted = true;
    let channel = null;
    let pollingInterval = null;
    let refreshInProgress = false;
    let refreshQueued = false;
    let currentUserId = null;

    const refreshUnreadMessages = async (userId) => {
      if (!userId || !isMounted) return;

      if (refreshInProgress) {
        refreshQueued = true;
        return;
      }

      refreshInProgress = true;

      try {
        const { data: memberships, error: membershipError } =
          await supabaseRegistrar
            .from("conversation_members")
            .select("conversation_id, joined_at")
            .eq("user_id", userId);

        if (membershipError) {
          console.error(
            "[Registrar Messages] Membership query failed:",
            membershipError
          );
          return;
        }

        if (!isMounted) return;

        if (!memberships?.length) {
          setHasUnreadMessages(false);
          return;
        }

        const joinedAtByConversation = new Map();

        memberships.forEach((membership) => {
          if (membership.conversation_id) {
            joinedAtByConversation.set(
              membership.conversation_id,
              membership.joined_at || null
            );
          }
        });

        const conversationIds = [...joinedAtByConversation.keys()];

        if (!conversationIds.length) {
          setHasUnreadMessages(false);
          return;
        }

        const { data: readStates, error: readStateError } =
          await supabaseRegistrar
            .from("message_reads")
            .select(
              "conversation_id, user_id, last_read_message_id, last_read_at"
            )
            .eq("user_id", userId)
            .in("conversation_id", conversationIds);

        if (readStateError) {
          console.error(
            "[Registrar Messages] Read-state query failed:",
            readStateError
          );
          return;
        }

        if (!isMounted) return;

        const readStateByConversation = new Map();

        (readStates || []).forEach((state) => {
          readStateByConversation.set(state.conversation_id, state);
        });

        const readMessageIds = [
          ...new Set(
            (readStates || [])
              .map((state) => state.last_read_message_id)
              .filter(Boolean)
          ),
        ];

        let readPositionByMessageId = new Map();

        if (readMessageIds.length) {
          const { data: readPositionMessages, error: readPositionError } =
            await supabaseRegistrar
              .from("messages")
              .select("id, conversation_id, created_at")
              .in("id", readMessageIds);

          if (readPositionError) {
            console.error(
              "[Registrar Messages] Read-position query failed:",
              readPositionError
            );
            return;
          }

          readPositionByMessageId = new Map(
            (readPositionMessages || []).map((message) => [message.id, message])
          );
        }

        if (!isMounted) return;

        const { data: messages, error: messagesError } = await supabaseRegistrar
          .from("messages")
          .select("id, conversation_id, sender_id, created_at, is_deleted")
          .in("conversation_id", conversationIds)
          .neq("sender_id", userId)
          .order("created_at", { ascending: false })
          .limit(1000);

        if (messagesError) {
          console.error(
            "[Registrar Messages] Incoming-message query failed:",
            messagesError
          );
          return;
        }

        if (!isMounted) return;

        const incomingMessages = (messages || []).filter((message) => {
          if (message.is_deleted) return false;

          const joinedAt = joinedAtByConversation.get(message.conversation_id);

          if (!joinedAt || !message.created_at) return true;

          const messageTime = new Date(message.created_at).getTime();
          const joinedTime = new Date(joinedAt).getTime();

          if (!Number.isFinite(messageTime) || !Number.isFinite(joinedTime)) {
            return true;
          }

          return messageTime >= joinedTime;
        });

        const unreadMessages = incomingMessages.filter((message) => {
          const readState = readStateByConversation.get(
            message.conversation_id
          );

          if (!readState) return true;

          const readMessageId = readState.last_read_message_id;

          if (readMessageId) {
            const readPosition = readPositionByMessageId.get(readMessageId);

            if (!readPosition?.created_at) {
              return true;
            }

            const messageTime = new Date(message.created_at).getTime();
            const readPositionTime = new Date(
              readPosition.created_at
            ).getTime();

            if (
              !Number.isFinite(messageTime) ||
              !Number.isFinite(readPositionTime)
            ) {
              return true;
            }

            return messageTime > readPositionTime;
          }

          if (!readState.last_read_at) return true;

          const messageTime = new Date(message.created_at).getTime();
          const lastReadTime = new Date(readState.last_read_at).getTime();

          if (!Number.isFinite(messageTime) || !Number.isFinite(lastReadTime)) {
            return true;
          }

          return messageTime > lastReadTime;
        });

        if (!isMounted) return;

        setHasUnreadMessages(unreadMessages.length > 0);

        console.log("[Registrar Messages] Unread check:", {
          conversations: conversationIds.length,
          incomingMessages: incomingMessages.length,
          unreadMessages: unreadMessages.length,
          unreadMessageIds: unreadMessages.map((message) => message.id),
          hasUnread: unreadMessages.length > 0,
        });
      } catch (error) {
        console.error(
          "[Registrar Messages] Unexpected unread-check error:",
          error
        );
      } finally {
        refreshInProgress = false;

        if (refreshQueued && isMounted && currentUserId) {
          refreshQueued = false;
          queueMicrotask(() => {
            if (isMounted && currentUserId) {
              void refreshUnreadMessages(currentUserId);
            }
          });
        } else {
          refreshQueued = false;
        }
      }
    };

    const initializeUnreadMessages = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseRegistrar.auth.getUser();

        if (error) {
          console.error("[Registrar Messages] Authentication failed:", error);
          return;
        }

        // Important: don't create a channel if this effect was cleaned up
        // while getUser() was still pending.
        if (!isMounted) return;

        if (!user) {
          setHasUnreadMessages(false);
          return;
        }

        currentUserId = user.id;

        // Use a unique name for each effect initialization.
        // This prevents a new effect from reusing an old channel name.
        const channelName = `registrar-unread-messages-${
          user.id
        }-${Date.now()}`;

        const unreadChannel = supabaseRegistrar.channel(channelName);

        // Register ALL listeners before subscribe().
        unreadChannel
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
            },
            (payload) => {
              if (!isMounted) return;

              console.log(
                "[Registrar Messages] Message database event:",
                payload.eventType
              );

              void refreshUnreadMessages(user.id);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "message_reads",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!isMounted) return;

              console.log(
                "[Registrar Messages] Read-state database event:",
                payload.eventType
              );

              void refreshUnreadMessages(user.id);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "conversation_members",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              if (!isMounted) return;
              void refreshUnreadMessages(user.id);
            }
          );

        // Assign before subscribing so cleanup can find this channel.
        channel = unreadChannel;

        unreadChannel.subscribe((status, error) => {
          if (!isMounted) return;

          console.log("[Registrar Messages] Unread realtime status:", status);

          if (error) {
            console.error(
              "[Registrar Messages] Realtime subscription error:",
              error
            );
          }

          if (status === "SUBSCRIBED") {
            void refreshUnreadMessages(user.id);
          }
        });

        void refreshUnreadMessages(user.id);

        pollingInterval = setInterval(() => {
          if (isMounted && currentUserId) {
            void refreshUnreadMessages(currentUserId);
          }
        }, 10000);
      } catch (error) {
        console.error("[Registrar Messages] Initialization error:", error);
      }
    };

    void initializeUnreadMessages();

    return () => {
      isMounted = false;
      currentUserId = null;

      if (pollingInterval !== null) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }

      if (channel) {
        const channelToRemove = channel;
        channel = null;

        void supabaseRegistrar.removeChannel(channelToRemove).catch((error) => {
          console.error("[Registrar Messages] Channel cleanup error:", error);
        });
      }
    };
  }, []);

  // =========================================================
  // LOGOUT CONFIRMATION
  // =========================================================

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // =========================================================
  // MAP NOTIFICATIONS
  // =========================================================

  const mapNotification = (notification) => ({
    id: notification.id,
    recipientId: notification.recipient_id,
    recipientRole: notification.recipient_role,
    type: notification.type,
    category: notification.category,
    title: notification.title,
    message: notification.message,
    relatedEntityType: notification.related_entity_type,
    relatedEntityId: notification.related_entity_id,
    actionPath: notification.action_path,
    createdBy: notification.created_by,
    readAt: notification.read_at,
    createdAt: notification.created_at,
  });

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = async (userId = null) => {
    try {
      setNotificationsLoading(true);

      let currentUserId = userId;

      if (!currentUserId) {
        const {
          data: { user },
          error: authError,
        } = await supabaseRegistrar.auth.getUser();

        if (authError) {
          console.error("Error getting user for notifications:", authError);
          return;
        }

        currentUserId = user?.id;
      }

      if (!currentUserId) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabaseRegistrar
        .from("notifications")
        .select(
          `
            id,
            recipient_id,
            recipient_role,
            type,
            category,
            title,
            message,
            related_entity_type,
            related_entity_id,
            action_path,
            created_by,
            read_at,
            created_at
          `
        )
        .eq("recipient_id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading registrar notifications:", error);
        setNotifications([]);
        return;
      }

      setNotifications((data || []).map(mapNotification));
    } catch (error) {
      console.error("Unexpected notification loading error:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // =========================================================
  // INITIAL NOTIFICATION LOAD
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseRegistrar.auth.getUser();

        if (error) {
          console.error("Notification auth error:", error);
          return;
        }

        if (!user || !isMounted) return;

        await loadNotifications(user.id);
      } catch (error) {
        console.error("Notification initialization error:", error);
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================
  // REALTIME NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    let channel = null;
    let isMounted = true;

    const subscribeToNotifications = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseRegistrar.auth.getUser();

        if (error) {
          console.error("Realtime notification auth error:", error);
          return;
        }

        if (!user || !isMounted) return;

        channel = supabaseRegistrar
          .channel(`registrar-notifications-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            (payload) => {
              console.log(
                "[Registrar Notifications] Database change:",
                payload
              );

              if (payload.eventType === "INSERT") {
                const newNotification = mapNotification(payload.new);

                setNotifications((previous) => {
                  const alreadyExists = previous.some(
                    (notification) => notification.id === newNotification.id
                  );

                  if (alreadyExists) return previous;

                  return [newNotification, ...previous].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                  );
                });
              }

              if (payload.eventType === "UPDATE") {
                const updatedNotification = mapNotification(payload.new);

                setNotifications((previous) =>
                  previous
                    .map((notification) =>
                      notification.id === updatedNotification.id
                        ? updatedNotification
                        : notification
                    )
                    .sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
                );

                setSelectedNotification((previous) =>
                  previous?.id === updatedNotification.id
                    ? updatedNotification
                    : previous
                );
              }

              if (payload.eventType === "DELETE") {
                const deletedId = payload.old?.id;

                setNotifications((previous) =>
                  previous.filter(
                    (notification) => notification.id !== deletedId
                  )
                );

                setSelectedNotification((previous) =>
                  previous?.id === deletedId ? null : previous
                );
              }
            }
          )
          .subscribe((status) => {
            console.log("[Registrar Notifications] Realtime status:", status);
          });
      } catch (error) {
        console.error("Unexpected realtime notification error:", error);
      }
    };

    subscribeToNotifications();

    return () => {
      isMounted = false;

      if (channel) {
        supabaseRegistrar.removeChannel(channel);
      }
    };
  }, []);

  // =========================================================
  // NOTIFICATION CONTROLS
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  // =========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // =========================================================

  const markNotificationRead = async (notificationId) => {
    const notification = notifications.find(
      (item) => item.id === notificationId
    );

    if (!notification || notification.readAt) return;

    const now = new Date().toISOString();

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notificationId ? { ...item, readAt: now } : item
      )
    );

    setSelectedNotification((previous) =>
      previous?.id === notificationId ? { ...previous, readAt: now } : previous
    );

    const { error } = await supabaseRegistrar
      .from("notifications")
      .update({ read_at: now })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId
            ? { ...item, readAt: notification.readAt }
            : item
        )
      );

      setSelectedNotification((previous) =>
        previous?.id === notificationId
          ? { ...previous, readAt: notification.readAt }
          : previous
      );
    }
  };

  // =========================================================
  // MARK ALL NOTIFICATIONS AS READ
  // =========================================================

  const markAllNotificationsRead = async () => {
    if (unreadCount === 0) return;

    const now = new Date().toISOString();

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        readAt: notification.readAt || now,
      }))
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseRegistrar.auth.getUser();

    if (authError || !user) {
      console.error("Unable to get current user:", authError);
      loadNotifications();
      return;
    }

    const { error } = await supabaseRegistrar
      .from("notifications")
      .update({ read_at: now })
      .eq("recipient_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      loadNotifications(user.id);
    }
  };

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  const deleteNotification = (notificationId) => {
    console.warn(
      "Registrars cannot delete notifications. Notification:",
      notificationId
    );
  };

  // =========================================================
  // OPEN NOTIFICATION
  // =========================================================

  const openNotification = async (notification) => {
    if (!notification) return;

    if (!notification.readAt) {
      await markNotificationRead(notification.id);
    }

    setIsNotificationOpen(false);

    setSelectedNotification({
      ...notification,
      readAt: notification.readAt || new Date().toISOString(),
    });
  };

  const closeNotificationModal = () => {
    setSelectedNotification(null);
  };

  // =========================================================
  // DARK MODE
  // =========================================================

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("registrarPortalDarkMode") === "true";
    } catch (error) {
      console.warn("[Registrar Portal] Unable to read dark mode:", error);
      return false;
    }
  });

  useEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", darkMode);
      localStorage.setItem("registrarPortalDarkMode", String(darkMode));
    } catch (error) {
      console.warn(
        "[Registrar Portal] Unable to apply or save dark mode:",
        error
      );
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((previous) => !previous);
  };

  // =========================================================
  // ROUTE CHANGE
  // =========================================================

  useEffect(() => {
    setIsNotificationOpen(false);
    setIsProfileOpen(false);
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // =========================================================
  // ESCAPE KEY
  // =========================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
        setSelectedNotification(null);
        setShowLogoutConfirm(false);
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // =========================================================
  // MOBILE BODY SCROLL LOCK
  // =========================================================

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // =========================================================
  // CLICK OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =========================================================
  // SIDEBAR ITEMS
  // =========================================================

  const sidebarItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/registrar/dashboard",
    },
    {
      name: "My Profile",
      icon: "👤",
      path: "/registrar/profile",
    },
    {
      name: "Student List",
      icon: "🎓",
      path: "/registrar/students",
    },
    {
      name: "Review Applications",
      icon: "📋",
      path: "/registrar/applications",
    },
    {
      name: "Manage Deployment",
      icon: "🚀",
      path: "/registrar/deployment",
    },
    {
      name: "Evaluations",
      icon: "📊",
      path: "/registrar/evaluations",
    },
    {
      name: "Notifications",
      icon: "🔔",
      path: "/registrar/notifications",
      badge: unreadCount > 0,
    },
    {
      name: "Messages",
      icon: "💬",
      path: "/registrar/messages",
      badge: hasUnreadMessages,
    },
    {
      name: "Settings",
      icon: "⚙",
      path: "/registrar/settings",
    },
  ];

  // =========================================================
  // EXPANDABLE MENUS
  // =========================================================

  const [expandedMenus, setExpandedMenus] = useState({});

  // =========================================================
  // SIDEBAR RESIZE
  // =========================================================

  const handleSidebarResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleSidebarResize = (e) => {
    if (!isResizing) return;

    const minWidth = 240;
    const maxWidth = 360;
    const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);

    setSidebarWidth(newWidth);
  };

  const handleSidebarResizeEnd = (e) => {
    setIsResizing(false);

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // Pointer capture may already be released.
    }
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigateTo = (path) => {
    navigate(path);
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMobileSidebarOpen(false);
  };

  const toggleSubmenu = (menuName) => {
    setExpandedMenus((previous) => ({
      ...previous,
      [menuName]: !previous[menuName],
    }));
  };

  const isPathActive = (path) => location.pathname === path;

  const isChildActive = (children) =>
    children?.some((child) => location.pathname === child.path);

  // =========================================================
  // PAGE TITLE
  // =========================================================

  const getPageTitle = () => {
    const currentItem = sidebarItems.find((item) => {
      if (item.path === location.pathname) return true;

      return item.children?.some((child) => child.path === location.pathname);
    });

    if (!currentItem) return "Registrar Portal";

    const child = currentItem.children?.find(
      (child) => child.path === location.pathname
    );

    return child ? child.name : currentItem.name;
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMobileSidebarOpen(false);
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    if (isLoggingOut) return;
    setShowLogoutConfirm(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      const {
        data: { user },
        error: userError,
      } = await supabaseRegistrar.auth.getUser();

      if (userError) {
        console.error(
          "Error getting authenticated user for logout:",
          userError
        );
      }

      if (user) {
        const { error: auditError } = await supabaseRegistrar.functions.invoke(
          "create-audit-log",
          {
            body: {
              action: "LOGOUT",
              module: "Authentication",
              target_entity_type: "User",
              target_entity_id: user.id,
              details: {
                email: user.email || registrarProfile.email || null,
                role: "registrar",
              },
            },
          }
        );

        if (auditError) {
          console.error("Logout audit log error:", auditError);
        }
      }

      const { error: signOutError } = await supabaseRegistrar.auth.signOut();

      if (signOutError) {
        console.error("Logout error:", signOutError);
        setIsLoggingOut(false);
        return;
      }

      // logout();

      setIsProfileOpen(false);
      setIsNotificationOpen(false);
      setSelectedNotification(null);
      setShowLogoutConfirm(false);
      setIsMobileSidebarOpen(false);

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  // =========================================================
  // SIDEBAR CONTENT
  // =========================================================

  const renderSidebarContent = (mobile = false) => (
    <>
      <div
        className={`h-20 flex-shrink-0 px-6 flex items-center border-b ${
          darkMode ? "border-slate-700" : "border-slate-100"
        }`}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex-shrink-0">
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt={`${registrarFullName} profile`}
              className="w-full h-full object-cover"
              onError={() => setProfilePhotoUrl("")}
            />
          ) : (
            <span>{profileLoading ? "..." : registrarInitials}</span>
          )}
        </div>

        <div className="ml-3 min-w-0">
          <h1 className="font-bold text-lg tracking-tight">SIMS</h1>
          <p
            className={`text-xs truncate ${
              darkMode ? "text-slate-400" : "text-slate-400"
            }`}
          >
            Registrar Portal
          </p>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close sidebar"
            className={`ml-auto flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
              darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
            }`}
          >
            ×
          </button>
        )}
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto px-3 py-4 pb-28"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const hasChildren = item.children?.length > 0;
            const isExpanded = expandedMenus[item.name];
            const active =
              isPathActive(item.path) || isChildActive(item.children);

            return (
              <div key={item.name}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren) {
                      toggleSubmenu(item.name);
                    } else if (item.path) {
                      navigateTo(item.path);
                    }
                  }}
                  className={`relative w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? darkMode
                        ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                        : "bg-emerald-50 text-emerald-700 shadow-sm"
                      : darkMode
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {active && (
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full ${
                        darkMode ? "bg-emerald-400" : "bg-emerald-600"
                      }`}
                    />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-base ${
                        active
                          ? darkMode
                            ? "bg-emerald-500/10"
                            : "bg-white"
                          : darkMode
                          ? "bg-slate-800"
                          : "bg-slate-100"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          active ? "bg-current" : "bg-red-500"
                        }`}
                        aria-label={
                          item.name === "Messages"
                            ? "Unread messages"
                            : "Unread notifications"
                        }
                        title={
                          item.name === "Messages"
                            ? "Unread messages"
                            : "Unread notifications"
                        }
                      />
                    )}

                    {hasChildren && (
                      <span
                        className={`text-xs transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    )}
                  </div>
                </button>

                {hasChildren && isExpanded && (
                  <div className="relative ml-7 pl-4 mt-1 mb-1 space-y-1">
                    <div
                      className={`absolute left-1 top-0 bottom-0 w-px ${
                        darkMode ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />

                    {item.children.map((child) => {
                      const childActive = isPathActive(child.path);

                      return (
                        <button
                          key={child.name}
                          type="button"
                          onClick={() => navigateTo(child.path)}
                          className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                            childActive
                              ? darkMode
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-emerald-50 text-emerald-700"
                              : darkMode
                              ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md ${
                              childActive
                                ? darkMode
                                  ? "bg-emerald-500/10"
                                  : "bg-white"
                                : darkMode
                                ? "bg-slate-800"
                                : "bg-slate-50"
                            }`}
                          >
                            {child.icon}
                          </span>

                          <span className="truncate">{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 p-4 border-t ${
          darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-100 bg-white"
        }`}
      >
        <button
          type="button"
          onClick={handleLogoutClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
            darkMode
              ? "text-slate-400 hover:bg-red-950 hover:text-red-400"
              : "text-slate-500 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* DESKTOP SIDEBAR */}

      <aside
        style={{ width: `${sidebarWidth}px` }}
        className={`fixed inset-y-0 left-0 z-[90] hidden h-screen flex-col overflow-hidden border-r transition-colors duration-300 lg:flex ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        } ${isResizing ? "select-none" : ""}`}
      >
        {renderSidebarContent(false)}

        <div
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          onPointerDown={handleSidebarResizeStart}
          onPointerMove={handleSidebarResize}
          onPointerUp={handleSidebarResizeEnd}
          onPointerCancel={handleSidebarResizeEnd}
          className={`absolute top-0 right-0 z-30 h-full w-1.5 cursor-col-resize touch-none ${
            isResizing
              ? "bg-emerald-500"
              : darkMode
              ? "hover:bg-slate-700"
              : "hover:bg-slate-300"
          }`}
        />
      </aside>

      <div
        className="hidden flex-shrink-0 lg:block"
        style={{ width: `${sidebarWidth}px` }}
        aria-hidden="true"
      />

      {/* MAIN AREA */}

      <div className="min-h-screen min-w-0 flex-1">
        {/* NAVBAR */}

        <header
          className={`sticky top-0 z-50 h-20 border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 ${
            darkMode
              ? "bg-slate-900 border-slate-700 text-white"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="flex items-center min-w-0 gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar"
              className={`lg:hidden flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
              }`}
            >
              ☰
            </button>

            <div className="min-w-0">
              <p
                className={`text-sm ${
                  darkMode ? "text-slate-400" : "text-slate-400"
                }`}
              >
                Registrar Portal
              </p>
              <h2 className="font-bold text-base sm:text-lg truncate">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 ml-auto flex-shrink-0">
            {/* DARK MODE */}

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg transition ${
                darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* NOTIFICATIONS */}

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen((previous) => !previous);
                  setIsProfileOpen(false);
                }}
                aria-label="Notifications"
                className={`relative w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                <span className="text-lg">🔔</span>

                {unreadCount > 0 && (
                  <span
                    className={`absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 ${
                      darkMode ? "border-slate-900" : "border-white"
                    }`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div
                  className={`fixed left-4 right-4 top-[84px] z-[100] w-auto max-w-none overflow-hidden rounded-2xl border shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[340px] sm:max-w-[calc(100vw-2rem)] ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold">Notifications</h3>
                      <p
                        className={`text-xs mt-0.5 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {notificationsLoading
                          ? "Loading..."
                          : unreadCount > 0
                          ? `${unreadCount} unread`
                          : "All caught up"}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="flex-shrink-0 text-[10px] font-bold text-emerald-500 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div
                    className="max-h-[calc(100vh-210px)] overflow-y-auto overscroll-y-auto sm:max-h-[380px]"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                    }}
                  >
                    {notificationsLoading ? (
                      <div className="p-6 text-center">
                        <div className="text-2xl mb-2 animate-pulse">🔔</div>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="text-2xl mb-2">🔔</div>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          No notifications
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`group relative border-b transition ${
                            darkMode
                              ? "border-slate-700 hover:bg-slate-700"
                              : "border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className="w-full text-left px-4 py-3"
                          >
                            <div className="flex gap-3">
                              <div className="pt-1.5 flex-shrink-0">
                                <span
                                  className={`block w-2 h-2 rounded-full ${
                                    notification.readAt
                                      ? darkMode
                                        ? "bg-slate-600"
                                        : "bg-slate-300"
                                      : "bg-emerald-500"
                                  }`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  <p className="text-xs font-bold break-words min-w-0 flex-1">
                                    {notification.title}
                                  </p>
                                  <span
                                    className={`text-[10px] whitespace-nowrap flex-shrink-0 ${
                                      darkMode
                                        ? "text-slate-500"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {new Date(
                                      notification.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>

                                <p
                                  className={`text-xs mt-1 leading-5 break-words ${
                                    darkMode
                                      ? "text-slate-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    className={`border-t ${
                      darkMode ? "border-slate-700" : "border-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => navigateTo("/registrar/notifications")}
                      className={`w-full py-3 text-xs font-bold ${
                        darkMode
                          ? "text-emerald-400 hover:bg-slate-700"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE */}

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen((previous) => !previous);
                  setIsNotificationOpen(false);
                }}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-xl ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt={registrarFullName}
                      className="w-full h-full object-cover"
                      onError={() => setProfilePhotoUrl("")}
                    />
                  ) : (
                    <span>{profileLoading ? "..." : registrarInitials}</span>
                  )}
                </div>

                <div className="hidden sm:block text-left max-w-44">
                  <p className="text-sm font-semibold truncate">
                    {profileLoading ? "Loading..." : registrarFullName}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      darkMode ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {registrarProfile.position || "Registrar"}
                  </p>
                </div>

                <span
                  className={`hidden sm:block text-xs transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {isProfileOpen && (
                <div
                  className={`absolute right-0 top-14 w-64 max-w-[calc(100vw-1rem)] rounded-xl border shadow-xl z-50 overflow-hidden ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`px-4 py-4 border-b ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        {profilePhotoUrl ? (
                          <img
                            src={profilePhotoUrl}
                            alt={registrarFullName}
                            className="w-full h-full object-cover"
                            onError={() => setProfilePhotoUrl("")}
                          />
                        ) : (
                          <span>{registrarInitials}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {registrarFullName}
                        </p>
                        <p
                          className={`text-xs mt-1 truncate ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {registrarProfile.email || "Registrar"}
                        </p>
                      </div>
                    </div>

                    {registrarProfile.employee_id && (
                      <p
                        className={`text-[11px] mt-3 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Employee ID:{" "}
                        <span className="font-semibold">
                          {registrarProfile.employee_id}
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo("/registrar/profile")}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/registrar/settings")}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </button>

                  <div
                    className={`border-t ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
                        darkMode
                          ? "text-red-400 hover:bg-red-950"
                          : "text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <main
          className={`min-w-0 min-h-[calc(100vh-5rem)] transition-colors duration-300 ${
            darkMode ? "bg-slate-950" : "bg-slate-50"
          }`}
        >
          <Outlet
            context={{
              darkMode,
              notifications,
              unreadCount,
              markNotificationRead,
              markAllNotificationsRead,
              deleteNotification,
              selectedNotification,
              openNotification,
              closeNotificationModal,
              registrarProfile,
              profilePhotoUrl,
              registrarFullName,
            }}
          />
        </main>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[80] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        </div>
      )}

      {/* MOBILE SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-[90] w-[280px] max-w-[85vw] h-screen flex flex-col overflow-hidden border-r shadow-2xl transform transition-transform duration-300 lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* NOTIFICATION MODAL */}

      {selectedNotification && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeNotificationModal}
        >
          <div
            className={`w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl shadow-2xl border transition-colors ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(event) => event.stopPropagation()}
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
            }}
          >
            <div
              className={`px-5 sm:px-6 py-5 border-b flex items-start justify-between gap-4 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    darkMode
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  🔔
                </div>

                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Notification
                  </p>
                  <h2 className="text-lg font-black break-words">
                    {selectedNotification.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={closeNotificationModal}
                className={`w-8 h-8 rounded-lg text-xl text-slate-400 flex-shrink-0 ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                ×
              </button>
            </div>

            <div className="px-5 sm:px-6 py-6">
              <p
                className={`text-sm leading-relaxed break-words ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {selectedNotification.message}
              </p>

              {selectedNotification.relatedEntityType && (
                <div
                  className={`mt-5 p-4 rounded-xl border ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Related Record
                  </p>
                  <p className="text-sm font-semibold mt-1 break-words">
                    {selectedNotification.relatedEntityType}
                  </p>

                  {selectedNotification.relatedEntityId && (
                    <p
                      className={`text-xs mt-1 break-all ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      ID: {selectedNotification.relatedEntityId}
                    </p>
                  )}

                  <p
                    className={`text-xs mt-2 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                {selectedNotification.type === "placement_confirmed" &&
                  selectedNotification.relatedEntityType ===
                    "InternshipApplication" && (
                    <button
                      type="button"
                      onClick={() => {
                        closeNotificationModal();
                        navigateTo("/registrar/deployment");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-600 hover:to-teal-700 transition"
                    >
                      Deploy this student
                    </button>
                  )}

                {selectedNotification.relatedEntityType ===
                  "InternshipApplication" && (
                  <button
                    type="button"
                    onClick={() => {
                      closeNotificationModal();
                      navigateTo("/registrar/applications");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-600 hover:to-teal-700 transition"
                  >
                    View Application
                  </button>
                )}

                {selectedNotification.relatedEntityType ===
                  "DocumentSubmission" && (
                  <button
                    type="button"
                    onClick={() => {
                      closeNotificationModal();
                      navigateTo("/registrar/documents");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-600 hover:to-teal-700 transition"
                  >
                    View Documents
                  </button>
                )}

                {selectedNotification.relatedEntityType === "StudentRecord" && (
                  <button
                    type="button"
                    onClick={() => {
                      closeNotificationModal();
                      navigateTo("/registrar/students");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-600 hover:to-teal-700 transition"
                  >
                    View Student Record
                  </button>
                )}

                {!selectedNotification.readAt && (
                  <button
                    type="button"
                    onClick={() =>
                      markNotificationRead(selectedNotification.id)
                    }
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Mark as Read
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeNotificationModal}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={cancelLogout}
        >
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 pt-6">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  darkMode
                    ? "bg-red-950 text-red-400"
                    : "bg-red-50 text-red-500"
                }`}
              >
                🚪
              </div>
            </div>

            <div className="px-6 pt-4">
              <h2 className="text-lg font-bold">Logout?</h2>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Are you sure you want to logout from your Registrar account?
              </p>
            </div>

            <div className="px-6 py-5 mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                } ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold transition ${
                  isLoggingOut
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-red-700"
                }`}
              >
                {isLoggingOut ? "Logging out..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarPortalLayout;
