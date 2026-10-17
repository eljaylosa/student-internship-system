import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";

const QUICK_QUESTIONS = [
  "How do I register?",
  "What documents do I need?",
  "How do I verify my email?",
  "I can't log in",
];

function BotIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="12" rx="4" />
      <path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" />
      <path d="M2 12v3M22 12v3" />
      <circle cx="12" cy="3" r="1" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="AI is typing">
      <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
        <BotIcon className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:300ms]" />
        <span className="sr-only">Generating response</span>
      </div>
    </div>
  );
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Hi there! 👋 I'm the SIMS AI Assistant. Ask me about registration, required documents, email verification, internships, or using SIMS. How can I help?",
    },
  ]);

  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const requestInProgressRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [isOpen, messages, isLoading]);

  async function sendMessage(value = input) {
    const question = value.trim();

    if (!question || requestInProgressRef.current) return;

    if (question.length > 500) {
      return;
    }

    requestInProgressRef.current = true;
    setIsLoading(true);
    setInput("");

    const userMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: question,
    };

    // Send recent conversation context, not just the latest question.
    const history = [
      ...messages
        .filter(
          (message) => message.sender === "user" || message.sender === "bot"
        )
        .slice(-10)
        .map((message) => ({
          role: message.sender === "user" ? "user" : "model",
          text: message.text,
        })),
      { role: "user", text: question },
    ];

    setMessages((previous) => [...previous, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke("sims-chatbot", {
        body: { messages: history },
      });

      if (error) {
        let detail = "";

        // Supabase may expose the function's JSON error response here.
        try {
          const context = error.context;
          if (context && typeof context.json === "function") {
            const payload = await context.json();
            detail = payload?.error || "";
          }
        } catch {
          // Fall back to a friendly message below.
        }

        throw new Error(detail || error.message || "Request failed.");
      }

      if (!data?.reply || typeof data.reply !== "string") {
        throw new Error(data?.error || "The AI returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: data.reply,
        },
      ]);
    } catch (error) {
      console.error("[SIMS Chatbot]", error);

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          sender: "bot",
          isError: true,
          text:
            error.message ||
            "Sorry, I couldn't connect to the AI right now. Please try again.",
        },
      ]);
    } finally {
      requestInProgressRef.current = false;
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    if (requestInProgressRef.current) return;

    setMessages([
      {
        id: `${Date.now()}-welcome`,
        sender: "bot",
        text: "Hi there! 👋 I'm the SIMS AI Assistant. What would you like to know?",
      },
    ]);
    setInput("");
  }

  return (
    <div className="sims-chatbot-widget fixed bottom-5 right-4 z-[100] sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          role="dialog"
          aria-label="SIMS AI Assistant chat"
          className="mb-4 flex h-[min(540px,calc(100dvh-120px))] w-[calc(100vw-32px)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:w-[380px]"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-4 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
              <BotIcon />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold">SIMS AI Assistant</h2>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Generative AI support
              </p>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              disabled={isLoading}
              title="Start a new chat"
              aria-label="Start a new chat"
              className="rounded-lg px-2 py-2 text-xs text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
            >
              New chat
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <CloseIcon />
            </button>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 p-4"
            aria-live="polite"
            aria-relevant="additions"
          >
            <p className="text-center text-[10px] font-medium text-slate-400">
              SIMS SUPPORT
            </p>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <BotIcon className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${
                    message.sender === "user"
                      ? "rounded-br-md bg-indigo-600 text-white"
                      : message.isError
                      ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700"
                      : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isLoading && <TypingIndicator />}

            {messages.length === 1 && !isLoading && (
              <div className="pt-1">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendMessage(question)}
                      className="rounded-full border border-indigo-100 bg-white px-3 py-2 text-left text-[11px] font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="border-t border-slate-100 bg-white p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything about SIMS..."
                aria-label="Type your question"
                maxLength={500}
                disabled={isLoading}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon />
              </button>
            </div>

            <p className="mt-2 text-center text-[9px] text-slate-400">
              AI-generated responses may be inaccurate.
            </p>
          </form>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-label={isOpen ? "Close SIMS Assistant" : "Open SIMS Assistant"}
          aria-expanded={isOpen}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/30 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-600/40 focus:outline-none focus:ring-4 focus:ring-indigo-200"
        >
          {isOpen ? (
            <CloseIcon className="h-6 w-6" />
          ) : (
            <BotIcon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          )}

          {!isOpen && (
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
          )}
        </button>
      </div>
    </div>
  );
}
