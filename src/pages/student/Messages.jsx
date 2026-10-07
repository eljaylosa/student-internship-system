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

  const [messagesLoading, setMessagesLoading] = useState(false);

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [peopleSearchQuery, setPeopleSearchQuery] = useState("");

  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesContainerRef = useRef(null);

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

            // We continue without photos.
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

            // If the contact is no longer in the active same-school
            // discovery list, don't expose it as a student contact.
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
            .order("created_at", {
              ascending: false,
            });

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

          if (companyError) {
            console.error(
              "[Student Messages] Error loading assigned company:",
              companyError
            );
          } else if (company?.user_id) {
            const { data: companyUser, error: companyUserError } =
              await supabaseStudent
                .from("users")
                .select(
                  `
                    id,
                    first_name,
                    middle_name,
                    last_name,
                    role,
                    status
                  `
                )
                .eq("id", company.user_id)
                .eq("role", "company")
                .eq("status", "active")
                .maybeSingle();

            if (companyUserError) {
              console.error(
                "[Student Messages] Error loading company user:",
                companyUserError
              );
            } else if (companyUser) {
              companyContact = {
                id: companyUser.id,
                contactId: null,
                name: company.company_name || "Company Supervisor",
                role: "Company Supervisor",
                roleValue: "company",
                status: companyUser.status,
                contactType: "company",
                companyId: company.id,
                unread: 0,
                profilePhotoUrl: null,
              };
            }
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
  // FIND DIRECT CONVERSATION
  // =========================================================

  const getOrCreateDirectConversation = async (contactUserId) => {
    if (!currentUser?.id || !contactUserId) {
      return null;
    }

    const userIds = [currentUser.id, contactUserId].sort();

    const directKey = `${userIds[0]}:${userIds[1]}`;

    const { data: existingConversation, error: findError } =
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
        .eq("type", "direct")
        .eq("direct_key", directKey)
        .maybeSingle();

    if (findError) {
      console.error(
        "[Student Messages] Error finding conversation:",
        findError
      );

      return null;
    }

    if (existingConversation) {
      return existingConversation;
    }

    return null;
  };

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  useEffect(() => {
    if (!currentUser?.id || !selectedContact?.id) return;

    let isMounted = true;
    let messageChannel = null;

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
        }));

        if (!isMounted) return;

        setMessages((previous) => ({
          ...previous,
          [selectedContact.id]: normalizedMessages,
        }));

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
              if (!isMounted) return;

              const message = payload.new;

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
              };

              setMessages((previous) => {
                const current = previous[selectedContact.id] || [];

                if (current.some((item) => item.id === normalizedMessage.id)) {
                  return previous;
                }

                return {
                  ...previous,
                  [selectedContact.id]: [...current, normalizedMessage],
                };
              });
            }
          )
          .subscribe((status) => {
            console.log("[Student Messages] Realtime status:", status);
          });
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

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [currentMessages.length, selectedContact?.id]);

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();

    if (!trimmedMessage) return;

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

    try {
      setSendingMessage(true);

      const { error } = await supabaseStudent.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        content: trimmedMessage,
      });

      if (error) {
        console.error("[Student Messages] Error sending message:", error);

        return;
      }

      setMessageInput("");
    } catch (error) {
      console.error("[Student Messages] Unexpected send error:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // =========================================================
  // SELECT CONTACT
  // =========================================================

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setMessageInput("");
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
                      Loading messages...
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
                              {message.text}
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
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
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
                      !messageInput.trim() ||
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
                    {sendingMessage ? "Sending..." : "Send"}
                  </button>
                </form>

                {selectedContact &&
                  !conversations[selectedContact.id] &&
                  !messagesLoading && (
                    <p className={`mt-2 text-[10px] ${mutedClass}`}>
                      No conversation exists with this contact yet.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Messages;
