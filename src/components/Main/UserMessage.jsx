import { useState, useEffect, useRef } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import "./UserMessage.css";

export default function UserMessage({ text, isEditing, onEditStart, onSave, onCancel, isLoading }) {
  const [inputValue, setInputValue] = useState(text);
  const textareaRef = useRef(null);

  // Sync local input and focus when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setInputValue(text);
      textareaRef.current?.focus();
    }
  }, [isEditing, text]);

  const handleSave = () => {
    onSave(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="edit-mode">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="edit-textarea"
          rows={3}
        />
        <div className="edit-buttons">
          <button onClick={handleSave} className="save-btn" aria-label="Save" title="Save"><FiCheck /></button>
          <button onClick={onCancel} className="cancel-btn" aria-label="Cancel" title="Cancel"><FiX /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-message-container">
      <div className="user-message-bubble">{text}</div>
      <button
        className="edit-msg-btn"
        onClick={onEditStart}
        aria-label="Edit message"
        style={{ visibility: isLoading ? "hidden" : "visible" }}
      >
        <FiEdit2 size={14} />
      </button>
    </div>
  );
}