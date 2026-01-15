import { useState, useEffect, useRef } from "react";
import { FiEdit2, FiCheck, FiX, FiPaperclip } from "react-icons/fi";
import Attachment from "../ChatInput/Attachment";
import AttachmentPreview from "../ChatInput/AttachmentPreview";
import "./UserMessage.css";

export default function UserMessage({ text, files = [], isEditing, onEditStart, onSave, onCancel, isLoading }) {
  const [inputValue, setInputValue] = useState(text);
  const [inputFiles, setInputFiles] = useState([]);
  const textareaRef = useRef(null);

  // Sync local input and focus when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setInputValue(text);
      // Wrap existing files for the preview component
      setInputFiles(files.map((f, i) => ({ file: f, id: `existing-${i}`, loading: false })));
      textareaRef.current?.focus();
    }
  }, [isEditing, text, files]);

  const handleSave = () => {
    onSave(inputValue, inputFiles.map(f => f.file));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleFilesSelected = (newFiles) => {
    const wrapped = newFiles.map((f) => ({
      file: f,
      id: Math.random().toString(36).substr(2, 9),
      loading: false,
    }));
    setInputFiles((prev) => [...prev, ...wrapped]);
  };

  const handleRemoveFile = (id) => {
    setInputFiles((prev) => prev.filter((f) => f.id !== id));
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
        <AttachmentPreview files={inputFiles} onRemove={handleRemoveFile} />
        <div className="edit-buttons">
          <Attachment onFilesSelected={handleFilesSelected} className="attach-btn-wrapper">
            <button className="icon-btn" aria-label="Attach file" title="Attach file" type="button" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <FiPaperclip size={16} />
            </button>
          </Attachment>
          <button onClick={handleSave} className="save-btn" aria-label="Save" title="Save"><FiCheck /></button>
          <button onClick={onCancel} className="cancel-btn" aria-label="Cancel" title="Cancel"><FiX /></button>
        </div>
      </div>
    );
  }

  // Prepare files for read-only display
  const displayFiles = files.map((f, i) => ({ file: f, id: `read-${i}`, loading: false }));

  return (
    <div className="user-message-container">
      <div className="user-message-bubble">
        {text}
        {files.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <AttachmentPreview files={displayFiles} />
          </div>
        )}
      </div>
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