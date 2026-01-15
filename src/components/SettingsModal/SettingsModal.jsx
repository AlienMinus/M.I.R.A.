import { useState, useEffect } from "react";
import { FiX, FiTrash2 } from "react-icons/fi";
import "./SettingsModal.css";

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  onClearHistory,
}) {
  const [model, setModel] = useState(() => localStorage.getItem("mira-model") || "ion");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant."
  );

  useEffect(() => {
    const handleModelChange = () => {
      const saved = localStorage.getItem("mira-model");
      if (saved) setModel(saved);
    };
    window.addEventListener("mira-model-change", handleModelChange);
    return () => window.removeEventListener("mira-model-change", handleModelChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-btn">
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Model</label>
            <select value={model} onChange={(e) => {
              const newModel = e.target.value;
              setModel(newModel);
              localStorage.setItem("mira-model", newModel);
              window.dispatchEvent(new Event("mira-model-change"));
            }}>
              <option value="ion">Ion - Ultra Flash</option>
              <option value="spark">Spark - Fast</option>
              <option value="quantum">Quantum - Reasoning</option>
              <option value="neutron">Neutron - Balanced</option>
              <option value="cosmos">Cosmos - Advanced</option>
              <option value="singularity">Singularity - Maximum</option>
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

          <div className="form-group danger-zone">
            <label>Danger Zone</label>
            <button
              onClick={onClearHistory}
              className="suggestion-btn clear-history-btn"
            >
              <FiTrash2 />
              Clear all chat history
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ model, temperature, systemPrompt });
              onClose();
            }}
            className="save-btn"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
