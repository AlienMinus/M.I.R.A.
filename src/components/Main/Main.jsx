import { useState, useEffect, useRef } from "react";
import { FiRefreshCw, FiArrowDown, FiCopy, FiCheck } from "react-icons/fi";
import ChatInput from "../ChatInput/ChatInput";
import UserMessage from "./UserMessage";
import AIResponse from "./AIResponse";
import "./Main.css";

export default function Main() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [lastCopied, setLastCopied] = useState(false);
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const timeoutRef = useRef(null);

  const generateResponse = () => {
    setIsLoading(true);
    setLastCopied(false);
    
    // Add placeholder for AI response
    setMessages((prev) => [...prev, { role: "ai", text: "" }]);

    const responseText = "I am **MIRA**. How can I *assist* you today?\n\nHere are some things I can do:\n- Answer questions\n- Generate code\n- Create images";
    let i = 0;

    if (timeoutRef.current) clearInterval(timeoutRef.current);

    // Simulate network delay (Thinking...)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = setInterval(() => {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = { ...newMessages[newMessages.length - 1] };
          lastMsg.text = responseText.slice(0, i + 1);
          newMessages[newMessages.length - 1] = lastMsg;
          return newMessages;
        });
        i++;
        if (i > responseText.length) {
          clearInterval(timeoutRef.current);
          setIsLoading(false);
        }
      }, 30);
    }, 1500);
  };

  const handleSendMessage = (text) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    generateResponse();
  };

  const handleRegenerate = () => {
    if (isLoading) return;
    // Remove last AI message
    setMessages((prev) => prev.slice(0, -1));
    generateResponse();
  };

  const handleCopyLast = () => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
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
    generateResponse();
  };

  const handleStop = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      clearInterval(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  };

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollBottom(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedPrompts = [
    "Plan a 3-day trip to Tokyo",
    "How does AI work?",
    "Write a Python script",
    "Design a logo concept"
  ];

  return (
    <main className="main">
      {messages.length === 0 ? (
        <div className="empty-state">
          <img src="/proicon-bg.png" alt="MIRA" className="empty-state-img" />
          <h1>What can I help with?</h1>
          <div className="suggested-prompts">
            {suggestedPrompts.map((prompt, idx) => (
              <button key={idx} className="suggestion-btn" onClick={() => handleSendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
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
                <AIResponse text={msg.text} />
              )}
            </div>
          ))}
          {messages.length > 0 && messages[messages.length - 1].role === "ai" && !isLoading && (
            <div className="regenerate-container">
              <button onClick={handleCopyLast} className="regenerate-btn" title="Copy response">
                {lastCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
              </button>
              <button onClick={handleRegenerate} className="regenerate-btn" title="Regenerate response">
                <FiRefreshCw size={14} />
              </button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {showScrollBottom && (
        <button className="scroll-bottom-btn" onClick={scrollToBottom} aria-label="Scroll to bottom">
          <FiArrowDown />
        </button>
      )}

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStop={handleStop}
      />
    </main>
  );
}
