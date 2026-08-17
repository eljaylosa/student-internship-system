import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

const Messages = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // CONTACTS
  // =========================================================

  const contacts = [
    {
      id: 1,
      name: "John Doe",
      role: "Intern",
      unread: 2,
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "Intern",
      unread: 0,
    },
    {
      id: 3,
      name: "Mike Wilson",
      role: "Intern",
      unread: 1,
    },
    {
      id: 4,
      name: "Prof. Davis",
      role: "Faculty Adviser",
      unread: 0,
    },
  ];

  // =========================================================
  // INITIAL MESSAGES
  // =========================================================

  const initialMessages = {
    1: [
      {
        id: 1,
        sender: "received",
        text: "Good morning, sir. I wanted to ask about my assigned tasks for today.",
        time: "9:20 AM",
      },
      {
        id: 2,
        sender: "sent",
        text: "Good morning, John. Please continue working on the documentation we discussed yesterday.",
        time: "9:24 AM",
      },
      {
        id: 3,
        sender: "received",
        text: "Alright, sir. Should I submit the updated documentation before the end of the day?",
        time: "9:26 AM",
      },
      {
        id: 4,
        sender: "sent",
        text: "Yes. Please send it to me once you're finished so I can review it.",
        time: "9:30 AM",
      },
    ],

    2: [
      {
        id: 1,
        sender: "received",
        text: "Good morning. I have completed the task assigned to me yesterday.",
        time: "8:45 AM",
      },
      {
        id: 2,
        sender: "sent",
        text: "Great. Please send the completed file so I can check your work.",
        time: "8:50 AM",
      },
    ],

    3: [
      {
        id: 1,
        sender: "received",
        text: "Sir, I would like to confirm the schedule for my assigned tasks this week.",
        time: "10:15 AM",
      },
      {
        id: 2,
        sender: "sent",
        text: "Your current schedule is already updated. Please check the internship schedule and let me know if you have any concerns.",
        time: "10:20 AM",
      },
    ],

    4: [
      {
        id: 1,
        sender: "received",
        text: "Good day. I wanted to ask for an update regarding the interns' performance.",
        time: "Yesterday",
      },
      {
        id: 2,
        sender: "sent",
        text: "Good day, Professor. The interns are progressing well. I will submit their performance updates once the evaluation period is completed.",
        time: "Yesterday",
      },
    ],
  };

  // =========================================================
  // STATE
  // =========================================================

  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // =========================================================
  // MESSAGE SCROLL REF
  // =========================================================

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
  // CONTACT CLASSES
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
  // AVATAR CLASSES
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

  // =========================================================
  // FILTERED CONTACTS
  // =========================================================

  const filteredContacts = contacts.filter((contact) =>
    `${contact.name} ${contact.role}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // =========================================================
  // CURRENT MESSAGES
  // =========================================================

  const currentMessages = messages[selectedContact.id] || [];

  // =========================================================
  // GET INITIALS
  // =========================================================

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

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
  }, [currentMessages.length, selectedContact.id]);

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage = (e) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();

    if (!trimmedMessage) return;

    const newMessage = {
      id: Date.now(),
      sender: "sent",
      text: trimmedMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage],
    }));

    setMessageInput("");
  };

  // =========================================================
  // SELECT CONTACT
  // =========================================================

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setMessageInput("");
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8 bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

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
            Communicate with your assigned interns and faculty adviser.
          </p>
        </div>

        {/* =====================================================
            MAIN MESSAGES CONTAINER
        ===================================================== */}

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
              {/* CONTACT HEADER */}

              <div
                className={`
                  p-4
                  border-b
                  flex-shrink-0
                  ${panelClass}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-sm font-bold ${headingClass}`}>Inbox</h2>

                  <span className={`text-xs ${mutedClass}`}>
                    {contacts.length}
                  </span>
                </div>

                {/* SEARCH */}

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

              {/* CONTACT LIST */}

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
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => {
                    const active = selectedContact.id === contact.id;

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
                          {/* AVATAR */}

                          <div
                            className={`
                              w-10
                              h-10
                              flex-shrink-0
                              rounded-lg
                              flex
                              items-center
                              justify-center
                              text-xs
                              font-bold
                              ${getAvatarClass(active)}
                            `}
                          >
                            {getInitials(contact.name)}
                          </div>

                          {/* CONTACT INFO */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
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

                              {contact.unread > 0 && (
                                <span
                                  className={`
                                    min-w-5
                                    h-5
                                    px-1.5
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                    text-[10px]
                                    font-bold
                                    flex-shrink-0
                                    ${
                                      active
                                        ? "bg-white text-slate-800"
                                        : "bg-red-500 text-white"
                                    }
                                  `}
                                >
                                  {contact.unread}
                                </span>
                              )}
                            </div>

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
                    <p className={`text-xs ${mutedClass}`}>
                      No contacts found.
                    </p>
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

                {/* MOBILE SEARCH */}

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

              {/* MOBILE CONTACT SCROLLER */}

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
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => {
                    const active = selectedContact.id === contact.id;

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
                          {/* AVATAR */}

                          <div
                            className={`
                              w-9
                              h-9
                              flex-shrink-0
                              rounded-lg
                              flex
                              items-center
                              justify-center
                              text-[10px]
                              font-bold
                              ${getAvatarClass(active)}
                            `}
                          >
                            {getInitials(contact.name)}
                          </div>

                          {/* CONTACT INFO */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
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

                              {contact.unread > 0 && (
                                <span
                                  className={`
                                    flex-shrink-0
                                    min-w-4
                                    h-4
                                    px-1
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                    text-[8px]
                                    font-bold
                                    ${
                                      active
                                        ? "bg-white text-slate-800"
                                        : "bg-red-500 text-white"
                                    }
                                  `}
                                >
                                  {contact.unread}
                                </span>
                              )}
                            </div>

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
                    <p className={`text-xs ${mutedClass}`}>
                      No contacts found.
                    </p>
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
                <div className="flex items-center gap-3 min-w-0">
                  {/* AVATAR */}

                  <div
                    className={`
                      w-10
                      h-10
                      flex-shrink-0
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      text-xs
                      font-bold
                      ${
                        darkMode
                          ? "bg-slate-700 text-slate-100"
                          : "bg-slate-800 text-white"
                      }
                    `}
                  >
                    {getInitials(selectedContact.name)}
                  </div>

                  {/* NAME */}

                  <div className="min-w-0">
                    <h2
                      className={`
                        text-sm
                        font-bold
                        truncate
                        ${headingClass}
                      `}
                    >
                      {selectedContact.name}
                    </h2>

                    <p className={`text-[10px] truncate ${mutedClass}`}>
                      {selectedContact.role}
                    </p>
                  </div>
                </div>

                {/* MORE OPTIONS */}

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
              </div>

              {/* =================================================
                  MESSAGE HISTORY
              ================================================= */}

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
                <div className="space-y-4">
                  {currentMessages.length > 0 ? (
                    currentMessages.map((message) => {
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
                              ${isSent ? "items-end" : "items-start"}
                              flex
                              flex-col
                            `}
                          >
                            {/* MESSAGE BUBBLE */}

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

                            {/* TIME */}

                            <span
                              className={`
                                text-[9px]
                                mt-1
                                px-1
                                ${mutedClass}
                              `}
                            >
                              {message.time}
                            </span>
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

              {/* =================================================
                  MESSAGE INPUT
              ================================================= */}

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
                    placeholder={`Message ${selectedContact.name}...`}
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
                      ${inputClass}
                    `}
                  />

                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="
                      h-11
                      px-4
                      sm:px-5
                      flex-shrink-0
                      rounded-lg
                      bg-slate-800
                      text-white
                      text-xs
                      font-bold
                      hover:bg-slate-700
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      transition
                    "
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Messages;
