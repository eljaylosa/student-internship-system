import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const Messages = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [currentUser, setCurrentUser] = useState(null);

  const [contacts, setContacts] = useState([]);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [addingContactId, setAddingContactId] = useState(null);

  const [selectedContact, setSelectedContact] = useState(null);

  const [conversations, setConversations] = useState({});
  const [messages, setMessages] = useState({});
  const [unreadByContact, setUnreadByContact] = useState({});

  const [messagesLoading, setMessagesLoading] = useState(false);

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [peopleSearchQuery, setPeopleSearchQuery] = useState("");

  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
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
  const conversationsRef = useRef(conversations);
  const selectedContactRef = useRef(selectedContact);

  useEffect(() => {
    messagesRefForSync.current = messages;
  }, [messages]);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // =========================================================
  // LOAD + SYNC UNREAD COUNTS ACROSS ALL CONVERSATIONS
  // =========================================================

  const unreadRefreshVersionRef = useRef(0);

  const refreshUnreadCounts = async () => {
    if (!currentUser?.id || contactsLoading) return;

    const refreshVersion = ++unreadRefreshVersionRef.current;

    try {
      // 1. Get every conversation the current user belongs to.
      const { data: memberships, error: membershipsError } =
        await supabaseStudent
          .from("conversation_members")
          .select("conversation_id, joined_at")
          .eq("user_id", currentUser.id);

      if (membershipsError) {
        console.warn(
          "[Student Messages] Failed to load unread memberships:",
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

      if (conversationIds.length === 0) {
        if (refreshVersion === unreadRefreshVersionRef.current) {
          setUnreadByContact({});
        }
        return;
      }

      // 2. Load incoming messages and this user's read positions.
      const [messagesResult, readsResult] = await Promise.all([
        supabaseStudent
          .from("messages")
          .select("id, conversation_id, sender_id, created_at, is_deleted")
          .in("conversation_id", conversationIds)
          .neq("sender_id", currentUser.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true }),

        supabaseStudent
          .from("message_reads")
          .select("conversation_id, last_read_at")
          .eq("user_id", currentUser.id)
          .in("conversation_id", conversationIds),
      ]);

      if (messagesResult.error) {
        console.warn(
          "[Student Messages] Failed to load unread messages:",
          messagesResult.error.message
        );
        return;
      }

      if (readsResult.error) {
        console.warn(
          "[Student Messages] Failed to load read positions:",
          readsResult.error.message
        );
        return;
      }

      // Ignore older requests if a newer refresh has already started.
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

      // 3. Count messages newer than the user's last-read timestamp.
      for (const message of messagesResult.data || []) {
        const senderId = message.sender_id;
        const conversationId = message.conversation_id;

        // Only show counts for people in this contact list.
        if (!contactIds.has(senderId)) continue;

        // The open conversation is being viewed, so don't show its badge.
        if (senderId === openContactId) continue;

        // Don't count messages created before the user joined the conversation.
        const joinedAt = membershipByConversation.get(conversationId);
        if (
          joinedAt &&
          new Date(message.created_at).getTime() < new Date(joinedAt).getTime()
        ) {
          continue;
        }

        const lastReadAt = readAtByConversation.get(conversationId);

        // No read record means no messages have been marked read yet.
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
      console.warn("[Student Messages] Unread count refresh failed:", error);
    }
  };

  useEffect(() => {
    if (!currentUser?.id || contactsLoading) return undefined;

    let isMounted = true;

    // Rebuild existing unread counts when Messages opens or the
    // contact list / selected conversation changes.
    void refreshUnreadCounts();

    const channel = supabaseStudent
      .channel(`student-incoming-message-badges-${currentUser.id}`)
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
            !isMounted ||
            !incoming?.conversation_id ||
            !incoming?.id ||
            incoming.sender_id === currentUser.id
          ) {
            return;
          }

          // The INSERT is committed before this event is delivered.
          // Re-querying prevents duplicate increments and catches up
          // with messages that arrived while this page was inactive.
          void markMessageDelivered(incoming.id);
          void refreshUnreadCounts();
        }
      )
      .subscribe((status) => {
        console.log(
          "[Student Messages] Incoming-message badge listener:",
          status
        );
      });

    return () => {
      isMounted = false;

      // Invalidate pending queries so they cannot overwrite newer counts.
      unreadRefreshVersionRef.current += 1;

      supabaseStudent.removeChannel(channel);
    };
  }, [currentUser?.id, contactsLoading, contacts, selectedContact?.id]);

  const MESSAGE_ATTACHMENT_BUCKET = "message-attachments";
  const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
  const MAX_ATTACHMENTS_PER_MESSAGE = 5;

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

  // =========================================================
  // GET AUTHENTICATED STUDENT
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const loadAuthenticatedUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseStudent.auth.getUser();

        if (error) {
          console.error("[Student Messages] Auth error:", error);
          return;
        }

        if (!isMounted) return;

        if (!user) {
          console.warn("[Student Messages] No authenticated user.");
          return;
        }

        setCurrentUser(user);
      } catch (error) {
        console.error(
          "[Student Messages] Failed to get authenticated user:",
          error
        );
      }
    };

    loadAuthenticatedUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================
  // PROFILE PHOTO URL
  // =========================================================

  const getProfilePhotoUrl = (storedPath) => {
    if (!storedPath) return null;

    let normalizedPath = storedPath;

    // Student profile photos are stored as:
    // profile-photos/<user-id>/profile-photo.ext
    //
    // Some student database rows only store:
    // <user-id>/profile-photo.ext
    //
    // Registrar profile photos are stored as:
    // registrars/<user-id>/profile-<timestamp>.ext

    if (
      !normalizedPath.startsWith("profile-photos/") &&
      !normalizedPath.startsWith("registrars/")
    ) {
      normalizedPath = `profile-photos/${normalizedPath}`;
    }

    const { data } = supabaseStudent.storage
      .from("profile-photos")
      .getPublicUrl(normalizedPath);

    console.log("[Profile Photo]", {
      storedPath,
      normalizedPath,
      publicUrl: data?.publicUrl,
    });

    return data?.publicUrl || null;
  };

  // =========================================================
  // COMPANY LOGO URL
  // =========================================================

  const getCompanyLogoUrl = async (logoPath) => {
    if (!logoPath) return null;

    // If the RPC already returns an external/public URL,
    // use it directly.
    if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
      return logoPath;
    }

    try {
      const { data, error } = await supabaseStudent.storage
        .from("company-logos")
        .createSignedUrl(logoPath, 60 * 60);

      if (error) {
        console.error(
          "[Student Messages] Error creating company logo URL:",
          error
        );

        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error(
        "[Student Messages] Unexpected company logo URL error:",
        error
      );

      return null;
    }
  };

  // =========================================================
  // BUILD USER NAME
  // =========================================================

  const buildName = (user, fallback = "Unknown User") => {
    const nameParts = [
      user?.first_name,
      user?.middle_name,
      user?.last_name,
    ].filter(Boolean);

    return nameParts.length > 0 ? nameParts.join(" ") : fallback;
  };

  // =========================================================
  // LOAD CONTACTS + PEOPLE YOU MAY KNOW
  // =========================================================

  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;

    const loadContacts = async () => {
      try {
        setContactsLoading(true);

        // =====================================================
        // 1. VERIFY CURRENT USER
        // =====================================================

        const { data: currentStudent, error: studentError } =
          await supabaseStudent
            .from("students")
            .select("id, school_id")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (studentError) {
          console.error(
            "[Student Messages] Error loading current student:",
            studentError
          );

          if (isMounted) {
            setContacts([]);
            setPeopleYouMayKnow([]);
          }

          return;
        }

        if (!currentStudent) {
          console.error(
            "[Student Messages] Current authenticated user is not a student."
          );

          if (isMounted) {
            setContacts([]);
            setPeopleYouMayKnow([]);
          }

          return;
        }

        if (!currentStudent.school_id) {
          console.warn(
            "[Student Messages] Current student has no school assignment."
          );

          if (isMounted) {
            setContacts([]);
            setPeopleYouMayKnow([]);
          }

          return;
        }

        // =====================================================
        // 2. LOAD SAME-SCHOOL STUDENTS
        //
        // IMPORTANT:
        // This is ONLY discovery.
        // We DO NOT call add_contact here.
        // =====================================================

        const { data: eligibleStudentUsers, error: eligibleError } =
          await supabaseStudent.rpc("get_student_message_contacts");

        if (eligibleError) {
          console.error(
            "[Student Messages] Error loading same-school students:",
            eligibleError
          );

          if (isMounted) {
            setPeopleYouMayKnow([]);
          }

          return;
        }

        const activeStudentUsers = (eligibleStudentUsers || []).filter(
          (student) =>
            student?.id &&
            student.id !== currentUser.id &&
            student.role === "student" &&
            student.status === "active" &&
            student.contact_type === "student"
        );

        console.log(
          "[Student Messages] Same-school students discovered:",
          activeStudentUsers
        );

        // =====================================================
        // 3. LOAD ACTUAL CONTACT ROWS
        //
        // These are the ONLY student contacts.
        // =====================================================

        const { data: contactRows, error: contactsError } =
          await supabaseStudent
            .from("contacts")
            .select(
              `
                id,
                user_id,
                contact_user_id,
                created_at
              `
            )
            .eq("user_id", currentUser.id)
            .order("created_at", {
              ascending: true,
            });

        if (contactsError) {
          console.error(
            "[Student Messages] Error loading contact rows:",
            contactsError
          );

          if (isMounted) {
            setContacts([]);
          }

          return;
        }

        const actualContactRows = (contactRows || []).filter(
          (contact) =>
            contact?.contact_user_id &&
            contact.contact_user_id !== currentUser.id
        );

        const existingContactIds = new Set(
          actualContactRows.map((contact) => contact.contact_user_id)
        );

        console.log("[Student Messages] Actual contact IDs:", [
          ...existingContactIds,
        ]);

        // =====================================================
        // 4. LOAD PROFILE PHOTOS
        //
        // IMPORTANT:
        // Profile failure must NOT remove a person from
        // People You May Know.
        // =====================================================

        const allStudentIds = activeStudentUsers.map((student) => student.id);

        let studentProfileRows = [];

        if (allStudentIds.length > 0) {
          const { data: profileRows, error: profilesError } =
            await supabaseStudent.rpc("get_student_message_contact_profiles", {
              p_contact_user_ids: allStudentIds,
            });

          if (profilesError) {
            console.error(
              "[Student Messages] Profile RPC error:",
              profilesError
            );

            studentProfileRows = [];
          } else {
            studentProfileRows = profileRows || [];
          }
        }

        const profilesById = new Map();

        studentProfileRows.forEach((user) => {
          profilesById.set(user.id, {
            ...user,
            profilePhotoUrl: getProfilePhotoUrl(user.profile_photo_url),
          });
        });

        // =====================================================
        // 5. BUILD ACTUAL STUDENT CONTACTS
        // =====================================================

        const studentContacts = actualContactRows
          .map((contact) => {
            const discoveredStudent = activeStudentUsers.find(
              (student) => student.id === contact.contact_user_id
            );

            const profile = profilesById.get(contact.contact_user_id);

            if (!discoveredStudent && !profile) {
              return null;
            }

            const source = profile || discoveredStudent;

            return {
              id: contact.contact_user_id,
              contactId: contact.id,
              name: buildName(source),
              role: "Student",
              roleValue: "student",
              status: source.status || "active",
              contactType: "student",
              profilePhotoUrl: profile?.profilePhotoUrl || null,
              unread: 0,
            };
          })
          .filter(Boolean);

        // =====================================================
        // 6. BUILD PEOPLE YOU MAY KNOW
        //
        // Same-school active students
        // MINUS actual contacts.
        // =====================================================

        const suggestedStudents = activeStudentUsers
          .filter((student) => !existingContactIds.has(student.id))
          .map((student) => {
            const profile = profilesById.get(student.id);

            return {
              id: student.id,
              name: profile ? buildName(profile) : buildName(student),
              role: "Student",
              roleValue: "student",
              status: student.status,
              contactType: "student",
              profilePhotoUrl: profile?.profilePhotoUrl || null,
            };
          });

        // =====================================================
        // 7. LOAD ASSIGNED REGISTRAR
        //
        // IMPORTANT:
        // Registrar appears ONLY after the student has an
        // assignment created through the placement workflow.
        // =====================================================

        const { data: registrarRows, error: registrarError } =
          await supabaseStudent.rpc("get_student_message_registrar");

        if (registrarError) {
          console.error(
            "[Student Messages] Error loading assigned registrar:",
            registrarError
          );
        }

        let registrarContact = null;

        const assignedRegistrar = registrarRows?.[0];

        if (assignedRegistrar?.id) {
          registrarContact = {
            id: assignedRegistrar.id,
            contactId: null,
            name: buildName(assignedRegistrar, "Registrar Adviser"),
            role: "Registrar Adviser",
            roleValue: "registrar",
            status: assignedRegistrar.status || "active",
            contactType: "registrar",
            unread: 0,
            profilePhotoUrl: getProfilePhotoUrl(
              assignedRegistrar.profile_photo_url
            ),
          };
        }

        console.log("[Student Messages] Assigned Registrar:", registrarContact);

        // =====================================================
        // 8. LOAD ASSIGNED COMPANY
        //
        // The company is determined from the student's
        // internship assignment.
        //
        // IMPORTANT:
        // We use companies.user_id directly as the messaging
        // contact ID.
        //
        // The company logo is loaded through the existing
        // get_company_logos RPC because the logo is stored
        // in auth metadata and the student client cannot
        // directly read another user's auth metadata.
        // =====================================================

        const { data: assignmentRows, error: assignmentsError } =
          await supabaseStudent
            .from("assignments")
            .select(
              `
                id,
                company_id,
                status,
                created_at
              `
            )
            .eq("student_id", currentUser.id)
            .eq("status", "active")
            .order("created_at", {
              ascending: false,
            });

        console.log("[Student Messages] Assignment rows:", assignmentRows);
        console.log("[Student Messages] Assignment error:", assignmentsError);

        if (assignmentsError) {
          console.error(
            "[Student Messages] Error loading assignments:",
            assignmentsError
          );
        }

        let companyContact = null;

        const latestAssignment = (assignmentRows || []).find(
          (assignment) => assignment.company_id
        );

        if (latestAssignment?.company_id) {
          const { data: company, error: companyError } = await supabaseStudent
            .from("companies")
            .select(
              `
                  id,
                  user_id,
                  company_name,
                  status
                `
            )
            .eq("id", latestAssignment.company_id)
            .maybeSingle();

          console.log("[Student Messages] Company row:", company);
          console.log("[Student Messages] Company error:", companyError);

          if (companyError) {
            console.error(
              "[Student Messages] Error loading assigned company:",
              companyError
            );
          } else if (company?.user_id) {
            // =================================================
            // LOAD COMPANY LOGO
            // =================================================

            let companyLogoUrl = null;

            const { data: companyLogoRows, error: companyLogoError } =
              await supabaseStudent.rpc("get_company_logos", {
                p_company_ids: [company.id],
              });

            console.log(
              "[Student Messages] Company logo rows:",
              companyLogoRows
            );

            console.log(
              "[Student Messages] Company logo error:",
              companyLogoError
            );

            if (companyLogoError) {
              console.error(
                "[Student Messages] Error loading company logo:",
                companyLogoError
              );
            } else {
              const companyLogoRow = (companyLogoRows || []).find(
                (row) => row.company_id === company.id
              );

              if (companyLogoRow?.logo_path) {
                companyLogoUrl = await getCompanyLogoUrl(
                  companyLogoRow.logo_path
                );
              }
            }

            // =================================================
            // BUILD COMPANY CONTACT
            // =================================================

            companyContact = {
              id: company.user_id,
              contactId: null,
              name: company.company_name || "Company Supervisor",
              role: "Company Supervisor",
              roleValue: "company",
              status: company.status || "active",
              contactType: "company",
              companyId: company.id,
              unread: 0,
              profilePhotoUrl: companyLogoUrl,
            };

            console.log("[Student Messages] Assigned Company:", companyContact);
          }
        }

        // =====================================================
        // 9. COMBINE CONTACTS
        // =====================================================

        const combinedContacts = [
          ...studentContacts,
          registrarContact,
          companyContact,
        ].filter(Boolean);

        const uniqueContacts = [];
        const seenContactIds = new Set();

        for (const contact of combinedContacts) {
          if (!contact?.id) continue;

          if (seenContactIds.has(contact.id)) {
            continue;
          }

          seenContactIds.add(contact.id);
          uniqueContacts.push(contact);
        }

        if (!isMounted) return;

        setContacts(uniqueContacts);
        setPeopleYouMayKnow(suggestedStudents);

        // =====================================================
        // 10. PRESERVE CURRENT SELECTION
        // =====================================================

        setSelectedContact((previous) => {
          if (previous) {
            const stillExists = uniqueContacts.some(
              (contact) => contact.id === previous.id
            );

            if (stillExists) {
              return previous;
            }
          }

          return uniqueContacts[0] || null;
        });

        console.log(
          "[Student Messages] Contacts:",
          uniqueContacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            role: contact.role,
            contactType: contact.contactType,
            profilePhotoUrl: contact.profilePhotoUrl,
          }))
        );

        console.log(
          "[Student Messages] People You May Know:",
          suggestedStudents.map((person) => ({
            id: person.id,
            name: person.name,
          }))
        );
      } catch (error) {
        console.error("[Student Messages] Unexpected contacts error:", error);

        if (isMounted) {
          setContacts([]);
          setPeopleYouMayKnow([]);
        }
      } finally {
        if (isMounted) {
          setContactsLoading(false);
        }
      }
    };

    loadContacts();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // =========================================================
  // ADD CONTACT
  // =========================================================

  const handleAddContact = async (person) => {
    if (!person?.id || !currentUser?.id) return;

    try {
      setAddingContactId(person.id);

      const { data, error } = await supabaseStudent.rpc("add_contact", {
        p_contact_user_id: person.id,
      });

      if (error) {
        console.error("[Student Messages] Error adding contact:", error);

        return;
      }

      console.log("[Student Messages] Contact added:", data);

      const addedPerson = peopleYouMayKnow.find(
        (item) => item.id === person.id
      );

      if (!addedPerson) {
        return;
      }

      const newContact = {
        ...addedPerson,
        contactId: data?.id || null,
        unread: 0,
      };

      setContacts((previous) => {
        if (previous.some((contact) => contact.id === newContact.id)) {
          return previous;
        }

        return [...previous, newContact];
      });

      setPeopleYouMayKnow((previous) =>
        previous.filter((item) => item.id !== person.id)
      );

      setSelectedContact(newContact);
    } catch (error) {
      console.error("[Student Messages] Unexpected add contact error:", error);
    } finally {
      setAddingContactId(null);
    }
  };

  // =========================================================
  // FIND OR CREATE DIRECT CONVERSATION
  // =========================================================
  //
  // IMPORTANT:
  // Conversation creation is handled by the secure
  // create_direct_conversation RPC.
  //
  // The RPC:
  // - validates the current authenticated user
  // - validates the other user
  // - checks can_users_message()
  // - checks the Student ↔ Company assignment relationship
  // - creates the canonical direct conversation
  // - creates both conversation_members rows
  // - returns the conversation UUID
  //
  // We intentionally do NOT directly INSERT into
  // conversations or conversation_members from the client.
  // =========================================================

  const getOrCreateDirectConversation = async (contactUserId) => {
    if (!currentUser?.id || !contactUserId) {
      return null;
    }

    try {
      const { data: conversationId, error } = await supabaseStudent.rpc(
        "create_direct_conversation",
        {
          p_other_user_id: contactUserId,
        }
      );

      if (error) {
        console.error(
          "[Student Messages] Error creating/finding direct conversation:",
          error
        );

        console.error(
          "[Student Messages] RPC error details:",
          JSON.stringify(error, null, 2)
        );

        return null;
      }

      if (!conversationId) {
        console.error(
          "[Student Messages] create_direct_conversation returned no conversation ID."
        );

        return null;
      }

      // Fetch the conversation row using the returned ID.
      const { data: conversation, error: conversationError } =
        await supabaseStudent
          .from("conversations")
          .select(
            `
              id,
              type,
              direct_key,
              created_at,
              updated_at
            `
          )
          .eq("id", conversationId)
          .maybeSingle();

      if (conversationError) {
        console.error(
          "[Student Messages] Error loading created conversation:",
          conversationError
        );

        return null;
      }

      if (!conversation) {
        console.error(
          "[Student Messages] Conversation was created but could not be loaded:",
          conversationId
        );

        return null;
      }

      console.log(
        "[Student Messages] Direct conversation ready:",
        conversation
      );

      return conversation;
    } catch (error) {
      console.error(
        "[Student Messages] Unexpected direct conversation error:",
        error
      );

      return null;
    }
  };

  // =========================================================
  // MESSAGE ATTACHMENTS
  // =========================================================

  const getSignedAttachmentUrl = async (filePath) => {
    if (!filePath) return null;

    const { data, error } = await supabaseStudent.storage
      .from(MESSAGE_ATTACHMENT_BUCKET)
      .createSignedUrl(filePath, 60 * 60);

    if (error) {
      console.error(
        "[Student Messages] Failed to create attachment URL:",
        error
      );
      return null;
    }

    return data?.signedUrl || null;
  };

  const loadAttachmentsForMessages = async (messageRows) => {
    const messageIds = (messageRows || [])
      .map((message) => message.id)
      .filter(Boolean);

    if (messageIds.length === 0) return {};

    const { data: attachmentRows, error } = await supabaseStudent
      .from("message_attachments")
      .select(
        "id, message_id, file_name, file_path, file_type, file_size, created_at"
      )
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "[Student Messages] Failed to load attachment metadata:",
        error
      );
      return {};
    }

    const attachmentsByMessageId = {};

    for (const attachment of attachmentRows || []) {
      const signedUrl = await getSignedAttachmentUrl(attachment.file_path);
      const normalizedAttachment = {
        id: attachment.id,
        fileName: attachment.file_name,
        filePath: attachment.file_path,
        fileType: attachment.file_type || "application/octet-stream",
        fileSize: attachment.file_size,
        createdAt: attachment.created_at,
        url: signedUrl,
      };

      if (!attachmentsByMessageId[attachment.message_id]) {
        attachmentsByMessageId[attachment.message_id] = [];
      }

      attachmentsByMessageId[attachment.message_id].push(normalizedAttachment);
    }

    return attachmentsByMessageId;
  };

  const isImageAttachment = (attachment) =>
    Boolean(attachment?.fileType?.startsWith("image/"));

  const formatFileSize = (size) => {
    if (size === null || size === undefined || Number.isNaN(Number(size))) {
      return "File";
    }
    const bytes = Number(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sanitizeFileName = (fileName) =>
    fileName
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 160) || "attachment";

  const handleChooseFiles = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    setAttachmentError("");

    if (incomingFiles.length === 0) return;

    setSelectedFiles((previous) => {
      const combined = [...previous, ...incomingFiles];
      const unique = [];
      const seen = new Set();

      for (const file of combined) {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(file);
        }
      }

      if (unique.length > MAX_ATTACHMENTS_PER_MESSAGE) {
        setAttachmentError(
          `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`
        );
        return unique.slice(0, MAX_ATTACHMENTS_PER_MESSAGE);
      }

      const tooLarge = unique.find((file) => file.size > MAX_ATTACHMENT_SIZE);
      if (tooLarge) {
        setAttachmentError(
          `${tooLarge.name} exceeds the 10 MB per-file limit.`
        );
        return unique
          .filter((file) => file.size <= MAX_ATTACHMENT_SIZE)
          .slice(0, MAX_ATTACHMENTS_PER_MESSAGE);
      }

      return unique.slice(0, MAX_ATTACHMENTS_PER_MESSAGE);
    });

    // Reset the input so choosing the same file again is possible.
    event.target.value = "";
  };

  const handleRemoveSelectedFile = (fileToRemove) => {
    setSelectedFiles((previous) =>
      previous.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
    setAttachmentError("");
  };

  // =========================================================
  // MESSAGE DELIVERY / READ RECEIPTS
  // =========================================================

  const markMessageDelivered = async (messageId) => {
    if (!messageId || !currentUser?.id) return;
    try {
      const { error } = await supabaseStudent.rpc("mark_message_delivered", {
        p_message_id: messageId,
      });
      if (error)
        console.warn(
          "[Student Messages] Could not mark message delivered:",
          error.message
        );
    } catch (error) {
      console.warn("[Student Messages] Delivery receipt failed:", error);
    }
  };

  const markConversationSeen = async (
    conversationId,
    latestMessageId = null
  ) => {
    if (!conversationId || !currentUser?.id) return;
    try {
      const { error } = await supabaseStudent.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
        p_message_id: latestMessageId,
      });
      if (error)
        console.warn(
          "[Student Messages] Could not mark conversation seen:",
          error.message
        );
    } catch (error) {
      console.warn("[Student Messages] Read receipt failed:", error);
    }
  };

  const refreshOutgoingMessageStatuses = async (conversationId, contactId) => {
    if (!conversationId || !contactId || !currentUser?.id) return;
    try {
      const { data, error } = await supabaseStudent.rpc(
        "get_outgoing_message_statuses",
        {
          p_conversation_id: conversationId,
        }
      );
      if (error) {
        console.warn(
          "[Student Messages] Could not refresh delivery statuses:",
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
                deliveredAt: row.delivered_at,
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
      setMessages((previous) => ({
        ...previous,
        [contactId]: (previous[contactId] || []).map((message) =>
          message.senderId === currentUser.id &&
          statusByMessageId.has(message.id)
            ? { ...message, ...statusByMessageId.get(message.id) }
            : message
        ),
      }));
    } catch (error) {
      console.warn("[Student Messages] Status refresh failed:", error);
    }
  };

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  useEffect(() => {
    if (!currentUser?.id || !selectedContact?.id) return;

    let isMounted = true;
    let messageChannel = null;
    let pollTimer = null;

    const loadConversation = async () => {
      try {
        setMessagesLoading(true);

        const conversation = await getOrCreateDirectConversation(
          selectedContact.id
        );

        if (!isMounted) return;

        if (!conversation) {
          setConversations((previous) => ({
            ...previous,
            [selectedContact.id]: null,
          }));

          setMessages((previous) => ({
            ...previous,
            [selectedContact.id]: [],
          }));

          return;
        }

        setConversations((previous) => ({
          ...previous,
          [selectedContact.id]: conversation,
        }));

        const { data: messageRows, error: messagesError } =
          await supabaseStudent
            .from("messages")
            .select(
              `
                id,
                conversation_id,
                sender_id,
                content,
                reply_to_message_id,
                is_edited,
                edited_at,
                is_deleted,
                deleted_at,
                created_at,
                updated_at
              `
            )
            .eq("conversation_id", conversation.id)
            .order("created_at", {
              ascending: true,
            });

        if (messagesError) {
          console.error(
            "[Student Messages] Error loading messages:",
            messagesError
          );

          if (isMounted) {
            setMessages((previous) => ({
              ...previous,
              [selectedContact.id]: [],
            }));
          }

          return;
        }

        const attachmentsByMessageId = await loadAttachmentsForMessages(
          messageRows || []
        );
        const messageIds = (messageRows || []).map((message) => message.id);
        const reactionsByMessageId = {};
        if (messageIds.length) {
          const { data: reactionRows, error: reactionError } =
            await supabaseStudent
              .from("message_reactions")
              .select("id, message_id, user_id, reaction, created_at")
              .in("message_id", messageIds);
          if (reactionError)
            console.error(
              "[Student Messages] Failed to load reactions:",
              reactionError
            );
          else
            for (const reaction of reactionRows || []) {
              if (!reactionsByMessageId[reaction.message_id])
                reactionsByMessageId[reaction.message_id] = [];
              reactionsByMessageId[reaction.message_id].push(reaction);
            }
        }

        const normalizedMessages = (messageRows || []).map((message) => ({
          id: message.id,
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          sender: message.sender_id === currentUser.id ? "sent" : "received",
          text: message.is_deleted
            ? "This message was deleted."
            : message.content || "",
          time: formatMessageTime(message.created_at),
          createdAt: message.created_at,
          isEdited: message.is_edited,
          isDeleted: message.is_deleted,
          replyToMessageId: message.reply_to_message_id,
          attachments: attachmentsByMessageId[message.id] || [],
          reactions: reactionsByMessageId[message.id] || [],
          status: message.sender_id === currentUser.id ? "sent" : null,
        }));

        if (!isMounted) return;

        setMessages((previous) => ({
          ...previous,
          [selectedContact.id]: normalizedMessages,
        }));

        // Acknowledge incoming messages as delivered, then mark the open
        // conversation as seen. Outgoing statuses are refreshed from Supabase.
        const incomingRows = (messageRows || []).filter(
          (row) => row.sender_id !== currentUser.id
        );
        await Promise.all(
          incomingRows.map((row) => markMessageDelivered(row.id))
        );
        const latestLoadedMessage = (messageRows || []).at(-1);
        if (latestLoadedMessage)
          await markConversationSeen(conversation.id, latestLoadedMessage.id);
        await refreshOutgoingMessageStatuses(
          conversation.id,
          selectedContact.id
        );

        messageChannel = supabaseStudent
          .channel(`student-messages-${currentUser.id}-${conversation.id}`)
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
                "[Student Messages] Realtime INSERT received:",
                payload
              );
              if (!isMounted) return;

              const message = payload.new;

              if (message.sender_id !== currentUser.id) {
                void markMessageDelivered(message.id);
                void markConversationSeen(conversation.id, message.id);
              }

              const normalizedMessage = {
                id: message.id,
                conversationId: message.conversation_id,
                senderId: message.sender_id,
                sender:
                  message.sender_id === currentUser.id ? "sent" : "received",
                text: message.is_deleted
                  ? "This message was deleted."
                  : message.content || "",
                time: formatMessageTime(message.created_at),
                createdAt: message.created_at,
                isEdited: message.is_edited,
                isDeleted: message.is_deleted,
                replyToMessageId: message.reply_to_message_id,
                status: message.sender_id === currentUser.id ? "sent" : null,
              };

              setMessages((previous) => {
                const current = previous[selectedContact.id] || [];

                if (current.some((item) => item.id === normalizedMessage.id)) {
                  return previous;
                }

                return {
                  ...previous,
                  [selectedContact.id]: [
                    ...current,
                    { ...normalizedMessage, attachments: [] },
                  ],
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
              if (!isMounted) return;
              const row = payload.new;
              setMessages((previous) => ({
                ...previous,
                [selectedContact.id]: (previous[selectedContact.id] || []).map(
                  (message) =>
                    message.id !== row.id
                      ? message
                      : {
                          ...message,
                          text: row.is_deleted
                            ? "This message was deleted."
                            : row.content || "",
                          isEdited: Boolean(row.is_edited),
                          isDeleted: Boolean(row.is_deleted),
                          editedAt: row.edited_at || null,
                          deletedAt: row.deleted_at || null,
                          attachments: row.is_deleted
                            ? []
                            : message.attachments,
                        }
                ),
              }));
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "message_reactions",
            },
            async () => {
              if (!isMounted) return;
              const { data: rows } = await supabaseStudent
                .from("messages")
                .select("id")
                .eq("conversation_id", conversation.id);
              const ids = (rows || []).map((row) => row.id);
              if (!ids.length || !isMounted) return;
              const { data: reactions, error } = await supabaseStudent
                .from("message_reactions")
                .select("id, message_id, user_id, reaction, created_at")
                .in("message_id", ids);
              if (error || !isMounted) return;
              const grouped = {};
              for (const reaction of reactions || []) {
                if (!grouped[reaction.message_id])
                  grouped[reaction.message_id] = [];
                grouped[reaction.message_id].push(reaction);
              }
              setMessages((previous) => ({
                ...previous,
                [selectedContact.id]: (previous[selectedContact.id] || []).map(
                  (message) => ({
                    ...message,
                    reactions: grouped[message.id] || [],
                  })
                ),
              }));
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
              const attachment = payload.new;
              if (!isMounted || !attachment?.message_id) return;

              // This subscription is intentionally unfiltered because the table
              // has no conversation_id column. Verify the message belongs to
              // this conversation before rendering its attachment.
              const { data: parentMessage, error: parentMessageError } =
                await supabaseStudent
                  .from("messages")
                  .select("id, conversation_id")
                  .eq("id", attachment.message_id)
                  .eq("conversation_id", conversation.id)
                  .maybeSingle();

              if (parentMessageError || !parentMessage || !isMounted) return;

              const signedUrl = await getSignedAttachmentUrl(
                attachment.file_path
              );
              if (!signedUrl || !isMounted) return;

              const normalizedAttachment = {
                id: attachment.id,
                fileName: attachment.file_name,
                filePath: attachment.file_path,
                fileType: attachment.file_type || "application/octet-stream",
                fileSize: attachment.file_size,
                createdAt: attachment.created_at,
                url: signedUrl,
              };

              setMessages((previous) => {
                const current = previous[selectedContact.id] || [];
                return {
                  ...previous,
                  [selectedContact.id]: current.map((message) => {
                    if (message.id !== attachment.message_id) return message;
                    const currentAttachments = message.attachments || [];
                    if (
                      currentAttachments.some(
                        (item) => item.id === normalizedAttachment.id
                      )
                    ) {
                      return message;
                    }
                    return {
                      ...message,
                      attachments: [
                        ...currentAttachments,
                        normalizedAttachment,
                      ],
                    };
                  }),
                };
              });
            }
          )
          .subscribe((status) => {
            console.log("[Student Messages] Realtime status:", status);
          });

        // Fallback sync: keep the open chat current even if the Realtime
        // publication/channel is misconfigured. Postgres Changes remains active.
        pollTimer = setInterval(async () => {
          try {
            const { data: freshRows, error: freshError } = await supabaseStudent
              .from("messages")
              .select(
                "id, conversation_id, sender_id, content, reply_to_message_id, is_edited, edited_at, is_deleted, deleted_at, created_at, updated_at"
              )
              .eq("conversation_id", conversation.id)
              .order("created_at", { ascending: true });
            if (freshError || !isMounted) {
              if (freshError)
                console.warn(
                  "[Student Messages] Realtime fallback sync failed:",
                  freshError.message
                );
              return;
            }
            const current =
              messagesRefForSync.current?.[selectedContact.id] || [];
            const currentById = new Map(current.map((item) => [item.id, item]));
            const messageIds = (freshRows || []).map((row) => row.id);
            let reactionsByMessageId = {};
            if (messageIds.length) {
              const { data: freshReactions, error: reactionsError } =
                await supabaseStudent
                  .from("message_reactions")
                  .select("id, message_id, user_id, reaction, created_at")
                  .in("message_id", messageIds);
              if (reactionsError) {
                console.warn(
                  "[Student Messages] Reaction fallback sync failed:",
                  reactionsError.message
                );
              } else {
                for (const reaction of freshReactions || []) {
                  if (!reactionsByMessageId[reaction.message_id])
                    reactionsByMessageId[reaction.message_id] = [];
                  reactionsByMessageId[reaction.message_id].push(reaction);
                }
              }
            }
            const missingRows = (freshRows || []).filter(
              (row) => !currentById.has(row.id)
            );
            let attachmentMap = {};
            if (missingRows.length) {
              try {
                attachmentMap = await loadAttachmentsForMessages(missingRows);
              } catch (attachmentError) {
                console.warn(
                  "[Student Messages] Could not sync new attachments:",
                  attachmentError
                );
              }
            }
            if (!isMounted) return;
            setMessages((previous) => {
              const existing = previous[selectedContact.id] || [];
              const byId = new Map(existing.map((item) => [item.id, item]));
              for (const row of freshRows || []) {
                const old = byId.get(row.id);
                byId.set(row.id, {
                  id: row.id,
                  conversationId: row.conversation_id,
                  senderId: row.sender_id,
                  sender:
                    row.sender_id === currentUser.id ? "sent" : "received",
                  text: row.is_deleted
                    ? "This message was deleted."
                    : row.content || "",
                  time: formatMessageTime(row.created_at),
                  createdAt: row.created_at,
                  isEdited: row.is_edited,
                  isDeleted: row.is_deleted,
                  replyToMessageId: row.reply_to_message_id,
                  attachments: old?.attachments?.length
                    ? old.attachments
                    : attachmentMap[row.id] || [],
                  // Polling is also a reaction-sync fallback when Postgres
                  // Changes isn't delivering message_reactions events.
                  reactions: Object.prototype.hasOwnProperty.call(
                    reactionsByMessageId,
                    row.id
                  )
                    ? reactionsByMessageId[row.id]
                    : old?.reactions || [],
                  status:
                    row.sender_id === currentUser.id
                      ? old?.status || "sent"
                      : null,
                });
              }
              return {
                ...previous,
                [selectedContact.id]: Array.from(byId.values()).sort(
                  (a, b) =>
                    new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
                ),
              };
            });
            await refreshOutgoingMessageStatuses(
              conversation.id,
              selectedContact.id
            );
          } catch (syncError) {
            console.warn(
              "[Student Messages] Realtime fallback sync error:",
              syncError
            );
          }
        }, 1500);
      } catch (error) {
        console.error(
          "[Student Messages] Unexpected conversation error:",
          error
        );

        if (isMounted) {
          setMessages((previous) => ({
            ...previous,
            [selectedContact.id]: [],
          }));
        }
      } finally {
        if (isMounted) {
          setMessagesLoading(false);
        }
      }
    };

    loadConversation();

    return () => {
      isMounted = false;

      if (pollTimer) clearInterval(pollTimer);
      if (messageChannel) {
        supabaseStudent.removeChannel(messageChannel);
      }
    };
  }, [currentUser?.id, selectedContact?.id]);

  // =========================================================
  // CURRENT MESSAGES
  // =========================================================

  const currentMessages = selectedContact
    ? messages[selectedContact.id] || []
    : [];

  // =========================================================
  // SCROLL
  // =========================================================

  const shouldAutoScrollRef = useRef(true);
  const previousContactIdRef = useRef(null);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    shouldAutoScrollRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      140;
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const changedContact = previousContactIdRef.current !== selectedContact?.id;
    previousContactIdRef.current = selectedContact?.id || null;
    if (changedContact) shouldAutoScrollRef.current = true;
    if (shouldAutoScrollRef.current) {
      requestAnimationFrame(() =>
        container.scrollTo({
          top: container.scrollHeight,
          behavior: changedContact ? "auto" : "smooth",
        })
      );
    }
  }, [currentMessages, selectedContact?.id]);

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();
    const filesToUpload = [...selectedFiles];

    if (!trimmedMessage && filesToUpload.length === 0) return;

    if (!currentUser?.id) {
      console.error("[Student Messages] No authenticated user.");
      return;
    }

    if (!selectedContact?.id) {
      console.error("[Student Messages] No selected contact.");
      return;
    }

    const conversation = conversations[selectedContact.id];
    if (!conversation) {
      console.warn(
        "[Student Messages] No conversation exists yet for this contact."
      );
      return;
    }

    const oversizedFile = filesToUpload.find(
      (file) => file.size > MAX_ATTACHMENT_SIZE
    );
    if (oversizedFile) {
      setAttachmentError(
        `${oversizedFile.name} exceeds the 10 MB per-file limit.`
      );
      return;
    }

    if (filesToUpload.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      setAttachmentError(
        `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`
      );
      return;
    }

    try {
      setSendingMessage(true);
      setUploadingAttachments(filesToUpload.length > 0);
      setAttachmentError("");

      // Create a message row first so the Storage path can include its ID.
      // A null content is valid for attachment-only messages.
      const { data: sentMessage, error: sendError } = await supabaseStudent.rpc(
        "send_message",
        {
          p_conversation_id: conversation.id,
          p_content: trimmedMessage || null,
          p_reply_to_message_id: null,
        }
      );

      if (sendError) {
        console.error("[Student Messages] Error sending message:", sendError);
        setAttachmentError(sendError.message || "Message could not be sent.");
        return;
      }

      const sentRow = Array.isArray(sentMessage) ? sentMessage[0] : sentMessage;
      if (!sentRow?.id) {
        setAttachmentError(
          "The message may have been sent, but its ID could not be confirmed. Please check the conversation before retrying."
        );
        return;
      }

      // Update the local conversation after the RPC succeeds, even for
      // text-only messages. Realtime is supplementary, not the UI's only path.
      const uploadedAttachments = [];

      for (const file of filesToUpload) {
        const safeName = sanitizeFileName(file.name);
        const uniqueName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}-${safeName}`;

        // Required by the existing Storage INSERT policy:
        // folder 1 = authenticated user ID; folder 3 = message ID.
        const filePath = `${currentUser.id}/${conversation.id}/${sentRow.id}/${uniqueName}`;

        const { error: uploadError } = await supabaseStudent.storage
          .from(MESSAGE_ATTACHMENT_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error(
            "[Student Messages] Attachment upload failed:",
            uploadError
          );
          setAttachmentError(
            `Message sent, but ${file.name} could not be uploaded: ${uploadError.message}`
          );
          continue;
        }

        const { data: attachmentRow, error: attachmentError } =
          await supabaseStudent.rpc("add_message_attachment", {
            p_message_id: sentRow.id,
            p_file_name: file.name,
            p_file_path: filePath,
            p_file_type: file.type || "application/octet-stream",
            p_file_size: file.size,
          });

        if (attachmentError) {
          console.error(
            "[Student Messages] Attachment metadata insert failed:",
            attachmentError
          );
          setAttachmentError(
            `${file.name} uploaded, but its attachment record could not be saved. Please contact support before deleting any files.`
          );
          continue;
        }

        const savedAttachment = Array.isArray(attachmentRow)
          ? attachmentRow[0]
          : attachmentRow;
        const signedUrl = await getSignedAttachmentUrl(filePath);

        uploadedAttachments.push({
          id: savedAttachment?.id || `${sentRow.id}-${filePath}`,
          fileName: savedAttachment?.file_name || file.name,
          filePath,
          fileType:
            savedAttachment?.file_type ||
            file.type ||
            "application/octet-stream",
          fileSize: savedAttachment?.file_size ?? file.size,
          createdAt: savedAttachment?.created_at || new Date().toISOString(),
          url: signedUrl,
        });
      }

      setMessages((previous) => {
        const current = previous[selectedContact.id] || [];
        const existingIndex = current.findIndex(
          (message) => message.id === sentRow.id
        );

        if (existingIndex >= 0) {
          return {
            ...previous,
            [selectedContact.id]: current.map((message) =>
              message.id === sentRow.id
                ? {
                    ...message,
                    text: sentRow.content || "",
                    status: "sent",
                    attachments: [
                      ...(message.attachments || []),
                      ...uploadedAttachments.filter(
                        (attachment) =>
                          !(message.attachments || []).some(
                            (item) => item.id === attachment.id
                          )
                      ),
                    ],
                  }
                : message
            ),
          };
        }

        return {
          ...previous,
          [selectedContact.id]: [
            ...current,
            {
              id: sentRow.id,
              conversationId: sentRow.conversation_id || conversation.id,
              senderId: sentRow.sender_id || currentUser.id,
              sender: "sent",
              text: sentRow.content || "",
              time: formatMessageTime(sentRow.created_at),
              createdAt: sentRow.created_at || new Date().toISOString(),
              isEdited: Boolean(sentRow.is_edited),
              isDeleted: Boolean(sentRow.is_deleted),
              replyToMessageId: sentRow.reply_to_message_id || null,
              attachments: uploadedAttachments,
              reactions: [],
              status: "sent",
            },
          ],
        };
      });

      void refreshOutgoingMessageStatuses(conversation.id, selectedContact.id);
      setMessageInput("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("[Student Messages] Unexpected send/upload error:", error);
      setAttachmentError(
        error?.message || "Message or attachment could not be sent."
      );
    } finally {
      setSendingMessage(false);
      setUploadingAttachments(false);
    }
  };

  // =========================================================
  // EDIT / DELETE / REACTIONS
  // =========================================================

  const handleStartEdit = (message) => {
    if (
      !message ||
      message.senderId !== currentUser?.id ||
      message.isDeleted ||
      !message.text
    )
      return;
    setEditingMessageId(message.id);
    setEditInput(message.text);
    setMessageActionError("");
  };

  const handleSaveEdit = async (message) => {
    const content = editInput.trim();
    if (!content || !message?.id) return;
    setMessageActionError("");
    const { data, error } = await supabaseStudent.rpc("edit_message", {
      p_message_id: message.id,
      p_content: content,
    });
    if (error) {
      setMessageActionError(error.message || "Could not edit message.");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setMessages((previous) => ({
      ...previous,
      [selectedContact.id]: (previous[selectedContact.id] || []).map((item) =>
        item.id !== message.id
          ? item
          : {
              ...item,
              text: row?.content ?? content,
              isEdited: true,
              editedAt: row?.edited_at || new Date().toISOString(),
            }
      ),
    }));
    setEditingMessageId(null);
    setEditInput("");
  };

  const handleDeleteMessage = async (message) => {
    if (
      !message?.id ||
      message.senderId !== currentUser?.id ||
      message.isDeleted
    )
      return;
    if (
      !window.confirm(
        "Delete this message? It will show as a deleted message in the conversation."
      )
    )
      return;
    setMessageActionError("");
    const { error } = await supabaseStudent.rpc("delete_message", {
      p_message_id: message.id,
    });
    if (error) {
      setMessageActionError(error.message || "Could not delete message.");
      return;
    }
    setMessages((previous) => ({
      ...previous,
      [selectedContact.id]: (previous[selectedContact.id] || []).map((item) =>
        item.id !== message.id
          ? item
          : {
              ...item,
              text: "This message was deleted.",
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              attachments: [],
              reactions: [],
            }
      ),
    }));
    if (editingMessageId === message.id) setEditingMessageId(null);
  };

  const handleReaction = async (message, reaction) => {
    if (!message?.id || message.isDeleted || !currentUser?.id) return;
    setReactionBusyId(message.id);
    setMessageActionError("");
    const existing = (message.reactions || []).find(
      (item) => item.user_id === currentUser.id
    );
    const result =
      existing?.reaction === reaction
        ? await supabaseStudent.rpc("remove_message_reaction", {
            p_message_id: message.id,
          })
        : await supabaseStudent.rpc("set_message_reaction", {
            p_message_id: message.id,
            p_reaction: reaction,
          });
    if (result.error) {
      setMessageActionError(
        result.error.message || "Could not update reaction."
      );
      setReactionBusyId(null);
      return;
    }
    const { data: rows, error } = await supabaseStudent
      .from("message_reactions")
      .select("id, message_id, user_id, reaction, created_at")
      .eq("message_id", message.id);
    if (!error)
      setMessages((previous) => ({
        ...previous,
        [selectedContact.id]: (previous[selectedContact.id] || []).map((item) =>
          item.id === message.id ? { ...item, reactions: rows || [] } : item
        ),
      }));
    setReactionBusyId(null);
  };

  // =========================================================
  // SELECT CONTACT
  // =========================================================

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    const existingConversation = conversations[contact.id];
    const existingMessages = messages[contact.id] || [];
    const latestMessage = existingMessages[existingMessages.length - 1];
    if (existingConversation && latestMessage) {
      void markConversationSeen(existingConversation.id, latestMessage.id);
      void refreshOutgoingMessageStatuses(existingConversation.id, contact.id);
    }
    setUnreadByContact((previous) => ({ ...previous, [contact.id]: 0 }));
    setMessageInput("");
    setSelectedFiles([]);
    setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const normalizedContactSearch = searchQuery.toLowerCase().trim();

  const filteredContacts = contacts.filter((contact) =>
    `${contact.name} ${contact.role}`
      .toLowerCase()
      .includes(normalizedContactSearch)
  );

  const normalizedPeopleSearch = peopleSearchQuery.toLowerCase().trim();

  const filteredPeopleYouMayKnow = peopleYouMayKnow.filter((person) =>
    `${person.name} ${person.role}`
      .toLowerCase()
      .includes(normalizedPeopleSearch)
  );

  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // =========================================================
  // MESSAGE TIME
  // =========================================================

  function formatMessageTime(date) {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // =========================================================
  // CONTACT BUTTON
  // =========================================================

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

  // =========================================================
  // AVATAR
  // =========================================================

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

  const renderAvatar = (contact, sizeClass = "w-10 h-10", active = false) => {
    return (
      <div
        className={`
          ${sizeClass}
          flex-shrink-0
          rounded-lg
          overflow-hidden
          flex
          items-center
          justify-center
          text-xs
          font-bold
          ${getAvatarClass(active)}
        `}
      >
        {contact?.profilePhotoUrl ? (
          <img
            src={contact.profilePhotoUrl}
            alt={contact.name || "Contact"}
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
            Student Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Messages
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            Chat with your contacts, school registrar, and assigned company
            supervisor.
          </p>
        </div>

        {/* ===================================================
            PEOPLE YOU MAY KNOW
            =================================================== */}

        <section
          className={`
            w-full
            border
            rounded-xl
            overflow-hidden
            shadow-sm
            mb-4
            ${mainContainerClass}
          `}
        >
          <div
            className={`
              p-4
              sm:p-5
              border-b
              ${panelClass}
            `}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className={`text-sm font-bold ${headingClass}`}>
                  People You May Know
                </h2>

                <p className={`text-[10px] mt-1 ${mutedClass}`}>
                  Active students from your school. Add them to your contacts to
                  start chatting.
                </p>
              </div>

              <span
                className={`
                  flex-shrink-0
                  px-2
                  py-1
                  rounded-full
                  text-[10px]
                  font-bold
                  ${
                    darkMode
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-200 text-slate-600"
                  }
                `}
              >
                {peopleYouMayKnow.length}
              </span>
            </div>

            <div className="relative mt-3">
              <input
                type="text"
                value={peopleSearchQuery}
                onChange={(e) => setPeopleSearchQuery(e.target.value)}
                placeholder="Search students..."
                className={`
                  w-full
                  h-9
                  px-3
                  pr-8
                  rounded-lg
                  border
                  text-xs
                  outline-none
                  transition
                  ${inputClass}
                `}
              />

              <span
                className={`
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-xs
                  pointer-events-none
                  ${mutedClass}
                `}
              >
                🔍
              </span>
            </div>
          </div>

          <div
            className={`
              p-3
              sm:p-4
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-2
              ${panelClass}
            `}
          >
            {contactsLoading ? (
              <div className="sm:col-span-2 lg:col-span-3 py-6 text-center">
                <p className={`text-xs ${mutedClass}`}>
                  Finding students from your school...
                </p>
              </div>
            ) : filteredPeopleYouMayKnow.length > 0 ? (
              filteredPeopleYouMayKnow.map((person) => (
                <div
                  key={person.id}
                  className={`
                    flex
                    items-center
                    gap-3
                    p-3
                    rounded-lg
                    border
                    ${
                      darkMode
                        ? "bg-slate-900 border-slate-700"
                        : "bg-white border-slate-200"
                    }
                  `}
                >
                  {renderAvatar(person, "w-10 h-10")}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`
                        text-xs
                        font-bold
                        truncate
                        ${headingClass}
                      `}
                    >
                      {person.name}
                    </p>

                    <p
                      className={`
                        text-[10px]
                        mt-1
                        truncate
                        ${mutedClass}
                      `}
                    >
                      Same school · Student
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddContact(person)}
                    disabled={addingContactId === person.id}
                    className={`
                      flex-shrink-0
                      px-3
                      h-8
                      rounded-lg
                      text-[10px]
                      font-bold
                      transition
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      ${
                        darkMode
                          ? "bg-white text-slate-900 hover:bg-slate-200"
                          : "bg-slate-800 text-white hover:bg-slate-700"
                      }
                    `}
                  >
                    {addingContactId === person.id ? "Adding..." : "+ Add"}
                  </button>
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3 py-6 text-center">
                <div className="text-2xl mb-2">👥</div>

                <p className={`text-xs font-semibold ${headingClass}`}>
                  No people to add
                </p>

                <p className={`text-[10px] mt-1 ${mutedClass}`}>
                  Students you haven't added yet will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            MAIN MESSAGES CONTAINER
            =================================================== */}

        <section
          className={`
            w-full
            border
            rounded-xl
            overflow-hidden
            shadow-sm
            ${mainContainerClass}
          `}
        >
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-[280px_minmax(0,1fr)]
              min-h-0
              md:h-[calc(100vh-220px)]
              md:max-h-[760px]
            "
          >
            {/* =================================================
                DESKTOP CONTACT SIDEBAR
                ================================================= */}

            <aside
              className={`
                hidden
                md:flex
                flex-col
                min-h-0
                border-r
                ${panelClass}
              `}
            >
              <div
                className={`
                  p-4
                  border-b
                  flex-shrink-0
                  ${panelClass}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-sm font-bold ${headingClass}`}>
                    Contacts
                  </h2>

                  <span className={`text-xs ${mutedClass}`}>
                    {contacts.length}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className={`
                      w-full
                      h-9
                      px-3
                      pr-8
                      rounded-lg
                      border
                      text-xs
                      outline-none
                      transition
                      ${inputClass}
                    `}
                  />

                  <span
                    className={`
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-xs
                      pointer-events-none
                      ${mutedClass}
                    `}
                  >
                    🔍
                  </span>
                </div>
              </div>

              <div
                className={`
                  flex-1
                  min-h-0
                  overflow-y-auto
                  p-3
                  space-y-2
                  ${panelClass}
                `}
              >
                {contactsLoading ? (
                  <div className="py-8 text-center">
                    <p className={`text-xs ${mutedClass}`}>
                      Loading contacts...
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
                        className={`
                          w-full
                          text-left
                          p-3
                          rounded-lg
                          border
                          transition-all
                          duration-200
                          ${getContactClass(active)}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {renderAvatar(contact, "w-10 h-10", active)}

                          <div className="min-w-0 flex-1">
                            <p
                              className={`
                                text-xs
                                font-bold
                                truncate
                                ${
                                  active
                                    ? "text-white"
                                    : darkMode
                                    ? "text-slate-100"
                                    : "text-slate-900"
                                }
                              `}
                            >
                              {contact.name}
                            </p>

                            <p
                              className={`
                                text-[10px]
                                mt-1
                                truncate
                                ${
                                  active
                                    ? "text-slate-300"
                                    : darkMode
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                }
                              `}
                            >
                              {contact.role}
                            </p>
                          </div>
                          {(unreadByContact[contact.id] || 0) > 0 && (
                            <span
                              aria-label={`${
                                unreadByContact[contact.id]
                              } unread messages`}
                              title={`${
                                unreadByContact[contact.id]
                              } unread messages`}
                              className={`flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                                active
                                  ? "bg-white text-indigo-700"
                                  : "bg-indigo-600 text-white"
                              }`}
                            >
                              {unreadByContact[contact.id] > 9
                                ? "9+"
                                : unreadByContact[contact.id]}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <div className="text-2xl mb-2">💬</div>

                    <p className={`text-xs ${headingClass}`}>
                      No contacts yet.
                    </p>

                    {peopleYouMayKnow.length > 0 && (
                      <p className={`text-[10px] mt-1 ${mutedClass}`}>
                        Add a student from People You May Know.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* =================================================
                MOBILE CONTACT BAR
                ================================================= */}

            <div
              className={`
                md:hidden
                border-b
                ${panelClass}
              `}
            >
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-bold ${headingClass}`}>
                      Contacts
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className={`
                      w-full
                      h-9
                      px-3
                      pr-8
                      rounded-lg
                      border
                      text-xs
                      outline-none
                      transition
                      ${inputClass}
                    `}
                  />

                  <span
                    className={`
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-xs
                      pointer-events-none
                      ${mutedClass}
                    `}
                  >
                    🔍
                  </span>
                </div>
              </div>

              <div
                className="
                  flex
                  gap-2
                  overflow-x-auto
                  overflow-y-hidden
                  px-3
                  pb-3
                  pt-1
                  snap-x
                  snap-mandatory
                  overscroll-x-contain
                "
              >
                {contactsLoading ? (
                  <div className="w-full py-4 text-center">
                    <p className={`text-xs ${mutedClass}`}>
                      Loading contacts...
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
                        className={`
                          flex-shrink-0
                          snap-start
                          min-w-[150px]
                          max-w-[190px]
                          p-2.5
                          rounded-xl
                          border
                          text-left
                          transition-all
                          duration-200
                          ${getContactClass(active)}
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderAvatar(contact, "w-9 h-9", active)}

                          <div className="min-w-0 flex-1">
                            <p
                              className={`
                                text-[11px]
                                font-bold
                                truncate
                                ${
                                  active
                                    ? "text-white"
                                    : darkMode
                                    ? "text-slate-100"
                                    : "text-slate-900"
                                }
                              `}
                            >
                              {contact.name}
                            </p>

                            <p
                              className={`
                                text-[9px]
                                mt-0.5
                                truncate
                                ${
                                  active
                                    ? "text-slate-300"
                                    : darkMode
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                }
                              `}
                            >
                              {contact.role}
                            </p>
                          </div>
                          {(unreadByContact[contact.id] || 0) > 0 && (
                            <span
                              aria-label={`${
                                unreadByContact[contact.id]
                              } unread messages`}
                              title={`${
                                unreadByContact[contact.id]
                              } unread messages`}
                              className={`flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                                active
                                  ? "bg-white text-indigo-700"
                                  : "bg-indigo-600 text-white"
                              }`}
                            >
                              {unreadByContact[contact.id] > 9
                                ? "9+"
                                : unreadByContact[contact.id]}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="w-full py-4 text-center">
                    <p className={`text-xs ${mutedClass}`}>No contacts yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                CHAT AREA
                ================================================= */}

            <div
              className={`
                flex
                flex-col
                min-w-0
                min-h-0
                h-[500px]
                sm:h-[550px]
                md:h-auto
                ${chatClass}
              `}
            >
              {/* CHAT HEADER */}

              <div
                className={`
                  h-[64px]
                  sm:h-[72px]
                  px-4
                  sm:px-5
                  border-b
                  flex
                  items-center
                  justify-between
                  flex-shrink-0
                  ${
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                {selectedContact ? (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      {renderAvatar(selectedContact, "w-10 h-10", false)}

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
                      className={`
                        w-9
                        h-9
                        flex-shrink-0
                        rounded-lg
                        border
                        transition
                        ${
                          darkMode
                            ? "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        }
                      `}
                      title="More options"
                    >
                      ⋮
                    </button>
                  </>
                ) : (
                  <div>
                    <h2 className={`text-sm font-bold ${headingClass}`}>
                      Messages
                    </h2>

                    <p className={`text-[10px] ${mutedClass}`}>
                      Select a contact to start chatting.
                    </p>
                  </div>
                )}
              </div>

              {/* MESSAGE HISTORY */}

              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className={`
                  flex-1
                  min-h-0
                  overflow-y-auto
                  overflow-x-hidden
                  p-4
                  sm:p-5
                  overscroll-contain
                  ${chatClass}
                `}
              >
                {messageActionError && (
                  <div
                    role="alert"
                    className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700"
                  >
                    {messageActionError}
                    <button
                      type="button"
                      onClick={() => setMessageActionError("")}
                      className="ml-2 font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
                {!selectedContact ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-3">💬</div>

                      <p className={`text-sm font-semibold ${headingClass}`}>
                        No conversation selected
                      </p>

                      <p className={`text-xs mt-1 ${mutedClass}`}>
                        Select a contact to view your messages.
                      </p>
                    </div>
                  </div>
                ) : messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <p className={`text-xs ${mutedClass}`}>
                      Opening conversation...
                    </p>
                  </div>
                ) : currentMessages.length > 0 ? (
                  <div className="space-y-4">
                    {currentMessages.map((message) => {
                      const isSent = message.sender === "sent";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isSent ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`
                              max-w-[88%]
                              sm:max-w-[75%]
                              flex
                              flex-col
                              ${isSent ? "items-end" : "items-start"}
                            `}
                          >
                            <div
                              className={`
                                px-3
                                sm:px-4
                                py-2.5
                                sm:py-3
                                rounded-xl
                                text-xs
                                leading-relaxed
                                break-words
                                whitespace-pre-wrap
                                ${
                                  isSent
                                    ? "bg-slate-800 text-white rounded-br-sm"
                                    : darkMode
                                    ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm"
                                    : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-sm"
                                }
                              `}
                            >
                              {editingMessageId === message.id ? (
                                <div className="min-w-[220px] space-y-2">
                                  <textarea
                                    value={editInput}
                                    onChange={(event) =>
                                      setEditInput(event.target.value)
                                    }
                                    rows={3}
                                    maxLength={10000}
                                    className={`w-full rounded-lg border p-2 text-xs outline-none ${inputClass}`}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMessageId(null);
                                        setEditInput("");
                                      }}
                                      className="rounded-md px-2 py-1 text-[10px] bg-white/10"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(message)}
                                      disabled={!editInput.trim()}
                                      className="rounded-md px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white disabled:opacity-50"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : message.isDeleted ? (
                                <span className="italic opacity-75">
                                  This message was deleted.
                                </span>
                              ) : (
                                message.text
                              )}
                              {!message.isDeleted &&
                                message.attachments?.length > 0 && (
                                  <div
                                    className={`mt-2 space-y-2 ${
                                      message.text
                                        ? "border-t border-white/20 pt-2"
                                        : ""
                                    }`}
                                  >
                                    {message.attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="min-w-0"
                                      >
                                        {isImageAttachment(attachment) &&
                                        attachment.url ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setImagePreview(attachment)
                                            }
                                            className="block text-left"
                                            title={`Preview ${attachment.fileName}`}
                                          >
                                            <img
                                              src={attachment.url}
                                              alt={attachment.fileName}
                                              loading="lazy"
                                              className="max-w-full max-h-64 rounded-lg object-contain bg-black/10"
                                            />
                                          </button>
                                        ) : (
                                          <a
                                            href={attachment.url || undefined}
                                            target="_blank"
                                            rel="noreferrer"
                                            download={attachment.fileName}
                                            className={`flex items-center gap-2 rounded-lg p-2 border ${
                                              isSent
                                                ? "border-white/20 bg-white/10 hover:bg-white/15"
                                                : darkMode
                                                ? "border-slate-600 bg-slate-900 hover:bg-slate-700"
                                                : "border-slate-300 bg-white hover:bg-slate-50"
                                            } ${
                                              !attachment.url
                                                ? "pointer-events-none opacity-60"
                                                : ""
                                            }`}
                                          >
                                            <span className="text-lg flex-shrink-0">
                                              📎
                                            </span>
                                            <span className="min-w-0 flex-1">
                                              <span className="block text-[11px] font-semibold break-all">
                                                {attachment.fileName}
                                              </span>
                                              <span className="block text-[9px] opacity-75">
                                                {formatFileSize(
                                                  attachment.fileSize
                                                )}
                                              </span>
                                            </span>
                                            <span className="text-xs flex-shrink-0">
                                              ↗
                                            </span>
                                          </a>
                                        )}
                                        {isImageAttachment(attachment) && (
                                          <a
                                            href={attachment.url || undefined}
                                            target="_blank"
                                            rel="noreferrer"
                                            download={attachment.fileName}
                                            className="inline-block mt-1 text-[10px] underline opacity-80 break-all"
                                          >
                                            {attachment.fileName} ·{" "}
                                            {formatFileSize(
                                              attachment.fileSize
                                            )}
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>

                            <span
                              className={`
                                text-[9px]
                                mt-1
                                px-1
                                ${mutedClass}
                              `}
                            >
                              {message.time}
                              {message.isEdited && " · edited"}
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
                            {!message.isDeleted && (
                              <div
                                className={`mt-1 flex flex-wrap items-center gap-1 px-1 ${
                                  isSent ? "justify-end" : "justify-start"
                                }`}
                              >
                                {[
                                  { value: "like", emoji: "👍", label: "Like" },
                                  { value: "love", emoji: "❤️", label: "Love" },
                                  { value: "haha", emoji: "😂", label: "Haha" },
                                  { value: "wow", emoji: "😮", label: "Wow" },
                                  { value: "sad", emoji: "😢", label: "Sad" },
                                  {
                                    value: "angry",
                                    emoji: "😡",
                                    label: "Angry",
                                  },
                                ].map((reaction) => {
                                  const matching = (
                                    message.reactions || []
                                  ).filter(
                                    (item) => item.reaction === reaction.value
                                  );
                                  const mine = matching.some(
                                    (item) => item.user_id === currentUser?.id
                                  );
                                  return (
                                    <button
                                      key={reaction.value}
                                      type="button"
                                      disabled={reactionBusyId === message.id}
                                      onClick={() =>
                                        handleReaction(message, reaction.value)
                                      }
                                      className={`rounded-full border px-1.5 py-0.5 text-[11px] transition ${
                                        mine
                                          ? "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/30"
                                          : darkMode
                                          ? "border-slate-700 hover:bg-slate-800"
                                          : "border-slate-200 hover:bg-slate-100"
                                      } disabled:opacity-40`}
                                      title={`React ${reaction.label}${
                                        mine ? " (click to remove)" : ""
                                      }`}
                                      aria-label={`React ${reaction.label}`}
                                    >
                                      {reaction.emoji}
                                    </button>
                                  );
                                })}
                                {isSent &&
                                  message.text &&
                                  editingMessageId !== message.id && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(message)}
                                      className={`rounded px-1.5 py-0.5 text-[10px] ${mutedClass} hover:text-blue-500`}
                                    >
                                      Edit
                                    </button>
                                  )}
                                {isSent && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(message)}
                                    className="rounded px-1.5 py-0.5 text-[10px] text-red-500 hover:bg-red-500/10"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                            {(() => {
                              const reactionOptions = [
                                { value: "like", emoji: "👍", label: "Like" },
                                { value: "love", emoji: "❤️", label: "Love" },
                                { value: "haha", emoji: "😂", label: "Haha" },
                                { value: "wow", emoji: "😮", label: "Wow" },
                                { value: "sad", emoji: "😢", label: "Sad" },
                                { value: "angry", emoji: "😡", label: "Angry" },
                              ];
                              const groupedReactions = reactionOptions
                                .map((reaction) => {
                                  const matching = (
                                    message.reactions || []
                                  ).filter(
                                    (item) => item.reaction === reaction.value
                                  );
                                  return {
                                    ...reaction,
                                    count: matching.length,
                                    mine: matching.some(
                                      (item) => item.user_id === currentUser?.id
                                    ),
                                  };
                                })
                                .filter((reaction) => reaction.count > 0);
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
                                      disabled={reactionBusyId === message.id}
                                      onClick={() =>
                                        handleReaction(message, reaction.value)
                                      }
                                      title={`${reaction.label}: ${
                                        reaction.count
                                      } reaction${
                                        reaction.count === 1 ? "" : "s"
                                      }${
                                        reaction.mine ? " · You reacted" : ""
                                      }`}
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition disabled:opacity-50 ${
                                        reaction.mine
                                          ? "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/30"
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${headingClass}`}>
                        No messages yet.
                      </p>

                      <p className={`text-xs mt-1 ${mutedClass}`}>
                        Start the conversation below.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* MESSAGE INPUT */}

              <div
                className={`
                  border-t
                  p-3
                  sm:p-4
                  flex-shrink-0
                  ${
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleChooseFiles}
                    className="hidden"
                    disabled={
                      !selectedContact ||
                      sendingMessage ||
                      !conversations[selectedContact?.id]
                    }
                  />

                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file) => (
                        <div
                          key={`${file.name}:${file.size}:${file.lastModified}`}
                          className={`flex items-center gap-2 max-w-full rounded-lg border px-2 py-1.5 ${
                            darkMode
                              ? "border-slate-700 bg-slate-800"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <span className="text-sm">
                            {file.type.startsWith("image/") ? "🖼️" : "📎"}
                          </span>
                          <span
                            className={`text-[10px] max-w-[180px] truncate ${headingClass}`}
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <span className={`text-[9px] ${mutedClass}`}>
                            {formatFileSize(file.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedFile(file)}
                            disabled={sendingMessage}
                            className={`text-xs px-1 ${mutedClass} hover:text-red-500 disabled:opacity-50`}
                            aria-label={`Remove ${file.name}`}
                            title="Remove attachment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {attachmentError && (
                    <p role="alert" className="text-[10px] text-red-500">
                      {attachmentError}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={
                        !selectedContact ||
                        sendingMessage ||
                        !conversations[selectedContact?.id] ||
                        selectedFiles.length >= MAX_ATTACHMENTS_PER_MESSAGE
                      }
                      className={`h-11 w-11 flex-shrink-0 rounded-lg border text-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        darkMode
                          ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Attach files (maximum 5 files, 10 MB each)"
                      aria-label="Attach files"
                    >
                      📎
                    </button>

                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={
                        selectedContact
                          ? `Message ${selectedContact.name}...`
                          : "Select a contact..."
                      }
                      disabled={
                        !selectedContact ||
                        sendingMessage ||
                        !conversations[selectedContact?.id]
                      }
                      autoComplete="off"
                      className={`
                      flex-1
                      min-w-0
                      h-11
                      px-3
                      sm:px-4
                      rounded-lg
                      border
                      text-xs
                      outline-none
                      transition
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      ${inputClass}
                    `}
                    />

                    <button
                      type="submit"
                      disabled={
                        (!messageInput.trim() && selectedFiles.length === 0) ||
                        !selectedContact ||
                        sendingMessage ||
                        !conversations[selectedContact?.id]
                      }
                      className={`
                      h-11
                      px-4
                      sm:px-5
                      flex-shrink-0
                      rounded-lg
                      text-xs
                      font-bold
                      transition
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      ${
                        darkMode
                          ? "bg-white text-slate-900 hover:bg-slate-200"
                          : "bg-slate-800 text-white hover:bg-slate-700"
                      }
                    `}
                    >
                      {uploadingAttachments
                        ? "Uploading..."
                        : sendingMessage
                        ? "Sending..."
                        : "Send"}
                    </button>
                  </div>
                </form>

                {selectedContact &&
                  !conversations[selectedContact.id] &&
                  !messagesLoading && (
                    <p className={`mt-2 text-[10px] ${mutedClass}`}>
                      This contact cannot be messaged right now.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </section>
        {imagePreview && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            onClick={() => setImagePreview(null)}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-2 text-2xl text-white hover:bg-white/25"
              aria-label="Close image preview"
            >
              ×
            </button>
            <div
              className="flex max-h-full max-w-full flex-col items-center gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={imagePreview.url}
                alt={imagePreview.fileName}
                className="max-h-[82vh] max-w-[92vw] rounded-lg object-contain"
              />
              <div className="flex items-center gap-3 text-xs text-white">
                <span className="max-w-[70vw] truncate">
                  {imagePreview.fileName}
                </span>
                <a
                  href={imagePreview.url}
                  target="_blank"
                  rel="noreferrer"
                  download={imagePreview.fileName}
                  className="underline"
                >
                  Open / download
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
