import { useState } from "react";
import { FiX, FiTrash2 } from "react-icons/fi";
import "./SettingsModal.css";

export default function SettingsModal({ isOpen, onClose, onSave, onClearHistory }) {
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-btn"><FiX /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
          <div className="form-group">
            <label>Temperature: {temperature}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>System Prompt</label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
          
          <div className="form-group" style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #27272a" }}>
            <label style={{ color: "#ef4444" }}>Danger Zone</label>
            <button 
              onClick={onClearHistory}
              className="suggestion-btn" 
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", borderColor: "#ef4444", color: "#ef4444" }}
            >
              <FiTrash2 />
              Clear all chat history
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={() => { onSave({ model, temperature, systemPrompt }); onClose(); }} className="save-btn">Save</button>
        </div>
      </div>
    </div>
  );
}