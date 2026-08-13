import React, { useState } from "react";

const Messages = () => {
  const contacts = [
    {
      id: 1,
      name: "Prof. Smith",
      role: "Faculty Adviser",
      unread: 3,
    },
    {
      id: 2,
      name: "Mr. Johnson (ABC)",
      role: "Company Supervisor",
      unread: 0,
    },
    {
      id: 3,
      name: "Prof. Davis",
      role: "Faculty Adviser",
      unread: 0,
    },
    {
      id: 4,
      name: "Ms. Wilson (XYZ)",
      role: "Company Supervisor",
      unread: 0,
    },
    {
      id: 5,
      name: "Prof. Brown",
      role: "Faculty Adviser",
      unread: 0,
    },
  ];

  const initialMessages = {
    1: [
      {
        id: 1,
        sender: "received",
        text: "Hello John, how is your internship application going?",
        time: "9:40 AM",
      },
      {
        id: 2,
        sender: "sent",
        text: "Hello Prof. Smith. I'm currently completing my requirements.",
        time: "9:42 AM",
      },
      {
        id: 3,
        sender: "received",
        text: "Good. Make sure all your documents are submitted before the deadline.",
        time: "9:45 AM",
      },
      {
        id: 4,
        sender: "sent",
        text: "Yes, professor. I'll make sure everything is submitted.",
        time: "9:47 AM",
      },
    ],

    2: [
      {
        id: 1,
        sender: "received",
        text: "Good day, John. We have received your application.",
        time: "10:15 AM",
      },
    ],

    3: [
      {
        id: 1,
        sender: "received",
        text: "Please remember to check your internship requirements.",
        time: "Yesterday",
      },
    ],

    4: [
      {
        id: 1,
        sender: "received",
        text: "Your application is currently being reviewed.",
        time: "Monday",
      },
    ],

    5: [
      {
        id: 1,
        sender: "received",
        text: "Please contact me if you have any questions.",
        time: "Friday",
      },
    ],
  };

  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // -----------------------------------------
  // SEND MESSAGE
  // -----------------------------------------

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

  // -----------------------------------------
  // SELECT CONTACT
  // -----------------------------------------

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
  };

  // -----------------------------------------
  // SEARCH
  // -----------------------------------------

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">
          Student Portal
        </p>

        <h1 className="text-2xl font-black text-slate-900">Messages</h1>

        <p className="text-sm text-slate-500 mt-1">
          Communicate with your faculty adviser and company supervisor.
        </p>
      </div>

      {/* =========================================
          MESSAGES CONTAINER
      ========================================= */}

      <section className="border border-slate-300 bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] min-h-[620px]">
          {/* =========================================
              CONTACTS
          ========================================= */}

          <aside className="border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50">
            {/* Contacts Header */}

            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Contacts</h2>

                <span className="text-xs text-slate-400">
                  {contacts.length}
                </span>
              </div>

              {/* Search */}

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-slate-700 transition"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  🔍
                </span>
              </div>
            </div>

            {/* Contact List */}

            <div className="p-3 space-y-2">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => {
                  const active = selectedContact.id === contact.id;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                        active
                          ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-900 hover:border-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}

                        <div
                          className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {contact.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)}
                        </div>

                        {/* Contact Info */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs font-bold truncate ${
                                active ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {contact.name}
                            </p>

                            {contact.unread > 0 && (
                              <span
                                className={`min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  active
                                    ? "bg-white text-slate-800"
                                    : "bg-red-500 text-white"
                                }`}
                              >
                                {contact.unread}
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-[10px] mt-1 truncate ${
                              active ? "text-slate-300" : "text-slate-400"
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
                  <p className="text-xs text-slate-400">No contacts found.</p>
                </div>
              )}
            </div>
          </aside>

          {/* =========================================
              CHAT AREA
          ========================================= */}

          <div className="flex flex-col min-w-0 bg-white">
            {/* Chat Header */}

            <div className="h-[72px] px-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                  {selectedContact.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedContact.name}
                  </h2>

                  <p className="text-[10px] text-slate-400">
                    {selectedContact.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
                title="More options"
              >
                ⋮
              </button>
            </div>

            {/* =========================================
                MESSAGE HISTORY
            ========================================= */}

            <div className="flex-1 p-5 overflow-y-auto min-h-[430px] max-h-[500px]">
              <div className="space-y-4">
                {(messages[selectedContact.id] || []).map((message) => {
                  const isSent = message.sender === "sent";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] ${
                          isSent ? "items-end" : "items-start"
                        } flex flex-col`}
                      >
                        <div
                          className={`px-4 py-3 rounded-xl text-xs leading-relaxed ${
                            isSent
                              ? "bg-slate-800 text-white rounded-br-sm"
                              : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-sm"
                          }`}
                        >
                          {message.text}
                        </div>

                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                          {message.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* =========================================
                MESSAGE INPUT
            ========================================= */}

            <div className="border-t border-slate-200 p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${selectedContact.name}...`}
                  className="flex-1 h-11 px-4 rounded-lg border border-slate-300 bg-slate-50 text-xs outline-none focus:bg-white focus:border-slate-700 transition"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="h-11 px-5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Messages;
