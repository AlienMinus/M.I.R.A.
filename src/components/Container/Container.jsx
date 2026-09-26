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
import responsesData from "../../data/responses";

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
    // Serialize messages, converting File objects to metadata for storage
    const messagesToSave = messages.map((msg) => ({
      ...msg,
      files: msg.files ? msg.files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type
      })) : [],
      images: msg.images || [],
      summary: msg.summary || "",
      sources: msg.sources || []
    }));
    localStorage.setItem(`mira-chat-${chatId}`, JSON.stringify(messagesToSave));

    const firstUserMsg = messages.find((m) => m.role === "user" && typeof m.text === "string");
    if (firstUserMsg && typeof firstUserMsg.text === "string") {
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

  const generateResponse = async (userMessage = "", hasFiles = false) => {
    setIsLoading(true);
    setLastCopied(false);

    // Initial placeholder AI message
    setMessages((prev) => [...prev, { role: "ai", text: "", images: [], summary: "", sources: [] }]);

    let responseData = null;

    try {
      // 1. PRIMARY: Query neural research backend pipeline
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, format: "auto" })
      }).catch(() => fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, format: "auto" })
      }));

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success) {
          responseData = {
            text: data.generated_text || "",
            images: data.images || [],
            summary: data.summary || "",
            sources: data.sources || []
          };
        }
      }
    } catch (err) {
      console.warn("[Container] Backend /generate unreachable, using local fallback:", err);
    }

    // 2. FALLBACK: Clean local responsesData with STRICT matching (no false substring matches)
    if (!responseData) {
      const input = userMessage.toLowerCase().trim();
      let responseText = null;

      // Exact match
      if (responsesData[input]) {
        responseText = responsesData[input];
      } else {
        // Multi-word phrase matching with word boundaries (\b)
        const sortedKeys = Object.keys(responsesData)
          .filter((k) => k !== "__fallback__" && k.split(" ").length >= 2)
          .sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
          const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`\\b${escaped}\\b`, "i");
          if (regex.test(input)) {
            responseText = responsesData[key];
            break;
          }
        }
      }

      if (!responseText) {
        responseText = responsesData.__fallback__ || "I am currently unable to reach the neural research engine. Please ensure the Python backend is running.";
      }

      responseData = {
        text: String(responseText),
        images: [],
        summary: "",
        sources: []
      };
    }

    const fullText = responseData.text;
    const finalImages = responseData.images;
    const finalSummary = responseData.summary;
    const finalSources = responseData.sources;

    let i = 0;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    typingTimeoutRef.current = setTimeout(() => {
      const step = fullText.length > 500 ? 5 : 2;
      typingIntervalRef.current = setInterval(() => {
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length === 0) {
            updated.push({ role: "ai", text: "", images: finalImages, summary: finalSummary, sources: finalSources });
          }
          const last = { ...updated[updated.length - 1] };
          last.images = finalImages;
          last.summary = finalSummary;
          last.sources = finalSources;
          last.text = fullText.slice(0, i + step);
          updated[updated.length - 1] = last;
          return updated;
        });

        i += step;

        if (i >= fullText.length) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          setIsLoading(false);
        }
      }, 15);
    }, hasFiles ? 1500 : 300);
  };

  const handleSendMessage = (text, files = []) => {
    setMessages((prev) => [...prev, { role: "user", text, files }]);
    generateResponse(text, files.length > 0);
  };

  const handleRegenerate = () => {
    if (isLoading) return;
    if (messages.length < 2) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUserMessage ? lastUserMessage.text : "";
    const hasFiles = lastUserMessage?.files?.length > 0;

    // Remove last AI message
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "ai") {
        return prev.slice(0, -1);
      }
      return prev;
    });

    if (userText || hasFiles) {
      generateResponse(userText, hasFiles);
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

  const saveEditedMessage = (index, newText, newFiles) => {
    if (!newText.trim() && (!newFiles || newFiles.length === 0)) return;
    // Keep messages up to the edited one, update it, and discard the rest
    const newMessages = messages.slice(0, index);
    newMessages.push({ role: "user", text: newText, files: newFiles });
    setMessages(newMessages);
    setEditingIndex(null);
    generateResponse(newText, newFiles?.length > 0);
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
      <Navbar onMenuClick={onMenuClick} isLoading={isLoading} />

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
                <div className="user-message-wrapper">
                  <UserMessage
                    text={msg.text}
                    files={msg.files}
                    isEditing={editingIndex === idx}
                    onEditStart={() => startEditing(idx)}
                    onSave={(newText, newFiles) => saveEditedMessage(idx, newText, newFiles)}
                    onCancel={cancelEditing}
                    isLoading={isLoading}
                  />
                  {msg.searchResults && msg.searchResults.length > 0 && (
                    <div className="search-results-grid">
                      {msg.searchResults.map((result, i) => (
                        <a 
                          key={i} 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="search-result-card"
                        >
                          <h4 className="search-result-title">{result.title}</h4>
                          <p className="search-result-snippet">{result.snippet}</p>
                          <span className="search-result-source">{new URL(result.link).hostname}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
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
                  <AIResponse 
                    text={msg.text} 
                    attachments={messages[idx - 1]?.role === "user" ? messages[idx - 1].files : []}
                    images={msg.images || []}
                    summary={msg.summary || ""}
                    sources={msg.sources || []}
                  />
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
