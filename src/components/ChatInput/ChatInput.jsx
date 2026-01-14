import { useEffect, useRef, useState } from "react";
import {
  FiPlus,
  FiMic,
  FiImage,
  FiUpload,
  FiSearch,
  FiCpu,
  FiSend,
  FiSquare
} from "react-icons/fi";
import "./ChatInput.css";

export default function ChatInput({ onSendMessage, isLoading, onStop }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() && !isLoading) return;

    if (isLoading) {
      onStop && onStop();
      return;
    }

    // Send message to parent
    if (onSendMessage) {
      onSendMessage(input);
    }

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-wrapper">
      {open && (
        <div ref={dropdownRef} className="dropdown">
          <DropdownItem icon={<FiUpload />} text="Add photos & files" />
          <DropdownItem icon={<FiImage />} text="Create image" />
          <DropdownItem icon={<FiSearch />} text="Deep research" />
          <DropdownItem icon={<FiCpu />} text="Thinking" />
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle options"
        >
          <FiPlus style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
        />

        <button
          type={input.trim() || isLoading ? "submit" : "button"}
          className="icon-btn"
          aria-label={isLoading ? "Stop generating" : input.trim() ? "Send" : "Voice input"}
        >
          {isLoading ? <FiSquare fill="currentColor" size={14} /> : input.trim() ? <FiSend /> : <FiMic />}
        </button>
      </form>
    </div>
  );
}

function DropdownItem({ icon, text }) {
  return (
    <div className="dropdown-item">
      <span className="dropdown-icon">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
