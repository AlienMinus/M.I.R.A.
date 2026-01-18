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
      searchResults: msg.searchResults || null
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

  const generateResponse = (userMessage = "", hasFiles = false, isWebSearch = false, searchResults = null) => {
    setIsLoading(true);
    setLastCopied(false);

    setMessages((prev) => [...prev, { role: "ai", text: "" }]);

    const input = userMessage.toLowerCase().trim();

    // Prioritize longer matches (e.g., "git commit" over "git")
    const sortedKeys = Object.keys(responsesData)
      .filter((key) => key !== "__fallback__")
      .sort((a, b) => b.length - a.length);

    let responseText = null;
    let matchedKey = null;

    if (isWebSearch) {
      if (searchResults && searchResults.length > 0) {
        responseText = `I searched the web for "${userMessage}" and found ${searchResults.length} results.\n\n`;
        responseText += searchResults.map(r => `**${r.title}**\n${r.snippet}`).join("\n\n");
        responseText += "\n\nIs there anything specific you would like to know from these results?";
      } else {
        responseText = `I searched the web for "${userMessage}" but found no results. Try rephrasing your query.`;
      }
    } else {
      for (const key of sortedKeys) {
        if (input.includes(key.toLowerCase())) {
          responseText = responsesData[key];
          matchedKey = key;
          break;
        }
      }
    }

    // If a generic key is matched (e.g., "joke"), check if there are numbered variations (e.g., "joke 1")
    // and pick one randomly to provide variety.
    if (matchedKey) {
      const variations = Object.keys(responsesData).filter((k) => {
        const lowerK = k.toLowerCase();
        const lowerMatched = matchedKey.toLowerCase();
        return (
          lowerK.startsWith(lowerMatched + " ") &&
          !isNaN(parseInt(lowerK.slice(lowerMatched.length + 1).trim()))
        );
      });

      if (variations.length > 0) {
        const randomKey =
          variations[Math.floor(Math.random() * variations.length)];
        responseText = responsesData[randomKey];
      }
    }

    if (!responseText) {
      responseText = responsesData.__fallback__ || "";
    }
    responseText = String(responseText);

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
          if (updated.length === 0) {
            // Ensure an AI message exists to update
            updated.push({ role: "ai", text: "" });
          }
          const last = { ...updated[updated.length - 1] };
          last.text = String(responseText).slice(0, i + 1);
          updated[updated.length - 1] = last;
          return updated;
        });

        i++;

        if (i >= String(responseText).length) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          setIsLoading(false);
        }
      }, 15);
    }, hasFiles ? 2000 : 400);
  };

  const handleSendMessage = (text, files = [], isWebSearch = false, searchResults = null) => {
    setMessages((prev) => [...prev, { role: "user", text, files, searchResults }]);
    generateResponse(text, files.length > 0, isWebSearch, searchResults);
  };

  const handleRegenerate = () => {
    if (isLoading) return;
    if (messages.length < 2) return;
    // Find the most recent user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUserMessage ? lastUserMessage.text : "";
    const hasFiles = lastUserMessage?.files?.length > 0;
    const isWebSearch = !!lastUserMessage?.searchResults;
    const searchResults = lastUserMessage?.searchResults || null;
    // Remove last AI message if it's present
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "ai") {
        return prev.slice(0, -1);
      }
      return prev;
    });
    if (userText || hasFiles || isWebSearch) {
      generateResponse(userText, hasFiles, isWebSearch, searchResults);
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
