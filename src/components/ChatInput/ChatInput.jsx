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
import Attachment from "./Attachment";
import AttachmentPreview from "./AttachmentPreview";

export default function ChatInput({ onSendMessage, isLoading, onStop }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
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
    if (!input.trim() && files.length === 0 && !isLoading) return;

    if (isLoading) {
      onStop && onStop();
      return;
    }

    // Send message to parent
    if (onSendMessage) {
      onSendMessage(input, files.map(f => f.file));
    }

    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleFilesSelected = (selectedFiles) => {
    const newFiles = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      loading: true
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setOpen(false);

    // Simulate processing time
    setTimeout(() => {
      setFiles(prev => prev.map(f => newFiles.find(nf => nf.id === f.id) ? { ...f, loading: false } : f));
    }, 1500);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles);
    }
  };

  return (
    <div 
      className={`chat-input-wrapper ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-content">
            <FiUpload className="drag-icon" />
            <p>Drop files here</p>
          </div>
        </div>
      )}

      {open && (
        <div ref={dropdownRef} className="dropdown">
          <Attachment onFilesSelected={handleFilesSelected}>
            <DropdownItem icon={<FiUpload />} text="Add photos & files" />
          </Attachment>
          <DropdownItem icon={<FiImage />} text="Create image" />
          <DropdownItem icon={<FiSearch />} text="Deep research" />
          <DropdownItem icon={<FiCpu />} text="Thinking" />
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        <AttachmentPreview files={files} onRemove={removeFile} />

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
          type={input.trim() || files.length > 0 || isLoading ? "submit" : "button"}
          className="icon-btn"
          aria-label={isLoading ? "Stop generating" : (input.trim() || files.length > 0) ? "Send" : "Voice input"}
        >
          {isLoading ? <FiSquare fill="currentColor" size={14} /> : (input.trim() || files.length > 0) ? <FiSend /> : <FiMic />}
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
