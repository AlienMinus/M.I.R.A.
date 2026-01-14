import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  FiRefreshCw,
  FiArrowDown,
  FiArrowUp,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import ChatInput from "../ChatInput/ChatInput";
import Navbar from "../Navbar/Navbar";
import UserMessage from "./UserMessage";
import "./Container.css";
import responsesData from "../../data/responses.json";

const AIResponse = lazy(() => import("./AIResponse"));

export default function Container({ chatId = 0, onMenuClick }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`mira-chat-${chatId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastCopied, setLastCopied] = useState(false);
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const notifyRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`mira-chat-${chatId}`, JSON.stringify(messages));

    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const title =
        firstUserMsg.text.length > 30
          ? firstUserMsg.text.slice(0, 30) + "..."
          : firstUserMsg.text;
      document.title = `${title} | M.I.R.A.`;
    } else {
      document.title = "M.I.R.A.";
    }

    if (messages.length > 0) {
      localStorage.setItem(
        `mira-chat-timestamp-${chatId}`,
        Date.now().toString()
      );

      if (notifyRef.current) clearTimeout(notifyRef.current);
      notifyRef.current = setTimeout(() => {
        window.dispatchEvent(new Event("mira-chat-update"));
      }, 500);
    }
  }, [messages, chatId]);

  const generateResponse = (userMessage = "") => {
  setIsLoading(true);
  setLastCopied(false);

  setMessages((prev) => [...prev, { role: "ai", text: "" }]);

  const input = userMessage.toLowerCase().trim();
  const words = input.split(/\s+/);

  let responseText = null;

  for (const key in responsesData) {
    if (key === "__fallback__") continue;

    if (
      input === key ||
      input.includes(key) ||
      words.includes(key)
    ) {
      responseText = responsesData[key];
      break;
    }
  }

  if (!responseText) {
    responseText = responsesData.__fallback__;
  }

  let i = 0;

  // Clear any existing timers
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
  }
  if (typingIntervalRef.current) {
    clearInterval(typingIntervalRef.current);
    typingIntervalRef.current = null;
  }

  typingTimeoutRef.current = setTimeout(() => {
    typingIntervalRef.current = setInterval(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        last.text = responseText.slice(0, i + 1);
        updated[updated.length - 1] = last;
        return updated;
      });

      i++;

      if (i >= responseText.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsLoading(false);
      }
    }, 15);
  }, 400);
};

  const handleSendMessage = (text) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    generateResponse(text);
  };

  const handleRegenerate = () => {
    if (isLoading) return;
    if (messages.length < 2) return;
    // Find the most recent user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUserMessage ? lastUserMessage.text : "";
    // Remove last AI message if it's present
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "ai") {
        return prev.slice(0, -1);
      }
      return prev;
    });
    if (userText) {
      generateResponse(userText);
    }
  }; 

  const handleCopyLast = () => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "ai" && lastMsg.text) {
      navigator.clipboard.writeText(lastMsg.text);
      setLastCopied(true);
      setTimeout(() => setLastCopied(false), 2000);
    }
  }; 

  const startEditing = (index) => {
    setEditingIndex(index);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
  };

  const saveEditedMessage = (index, newText) => {
    if (!newText.trim()) return;
    // Keep messages up to the edited one, update it, and discard the rest
    const newMessages = messages.slice(0, index);
    newMessages.push({ role: "user", text: newText });
    setMessages(newMessages);
    setEditingIndex(null);
    generateResponse(newText);
  };

  const handleStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setIsLoading(false);
  }; 

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollBottom(!isNearBottom);

      const isScrolledDown = scrollTop > 200;
      setShowScrollTop(isScrolledDown);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (notifyRef.current) {
        clearTimeout(notifyRef.current);
        notifyRef.current = null;
      }
    };
  }, []);

  const suggestedPrompts = [
    "Plan a 3-day trip to Tokyo",
    "How does AI work?",
    "Write a Python script",
    "Design a logo concept",
  ];

  return (
    <section
      className={`main ${messages.length > 0 ? "chat-active" : "chat-empty"}`}
    >
      <Navbar onMenuClick={onMenuClick} />

      <div className={`empty-state ${messages.length > 0 ? "fade-out" : ""}`}>
        <h1>What can I help with?</h1>
        <div className="suggested-prompts">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              className="suggestion-btn"
              onClick={() => handleSendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="messages-list" ref={listRef} onScroll={handleScroll}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.role === "user" ? (
                <UserMessage
                  text={msg.text}
                  isEditing={editingIndex === idx}
                  onEditStart={() => startEditing(idx)}
                  onSave={(newText) => saveEditedMessage(idx, newText)}
                  onCancel={cancelEditing}
                  isLoading={isLoading}
                />
              ) : (
                <Suspense
                  fallback={
                    <div className="ai-response-container">
                      <div className="ai-message-bubble" role="status" aria-live="polite">
                        <div className="thinking-dots">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <AIResponse text={msg.text} />
                </Suspense>
              )}
            </div>
          ))}
          {messages.length > 0 &&
            messages[messages.length - 1].role === "ai" &&
            !isLoading && (
              <div className="regenerate-container" aria-live="polite">
                <button
                  onClick={handleCopyLast}
                  className="regenerate-btn"
                  title="Copy response"
                  aria-label="Copy response"
                  disabled={isLoading}
                >
                  {lastCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="regenerate-btn"
                  title="Regenerate response"
                  aria-label="Regenerate response"
                  disabled={isLoading}
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>
            )}
          <div ref={bottomRef} />
        </div>
      )}

      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <FiArrowUp />
        </button>
      )}

      {showScrollBottom && (
        <button
          className="scroll-bottom-btn"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <FiArrowDown />
        </button>
      )}

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStop={handleStop}
      />
    </section>
  );
}
