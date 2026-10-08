import { useState, useEffect } from "react";
import {
  FiX,
  FiTrash2,
  FiCpu,
  FiSliders,
  FiSliders as FiTune,
  FiEye,
  FiDatabase,
  FiDownload,
  FiRefreshCw,
  FiCheck,
  FiAlertTriangle
} from "react-icons/fi";
import "./SettingsModal.css";

const PRESET_PROMPTS = [
  { label: "🤖 Default", prompt: "You are MIRA, a helpful, precise, and encyclopedic AI assistant." },
  { label: "🔬 Researcher", prompt: "You are an objective scientific researcher. Prioritize verified facts, academic context, and rigorous citations." },
  { label: "⚡ Concise", prompt: "You are a concise expert. Provide direct, highly distilled answers without conversational filler." },
  { label: "💼 Professional", prompt: "You are a professional enterprise consultant. Deliver polished, structured, and actionable guidance." }
];

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  onClearHistory,
}) {
  const [activeTab, setActiveTab] = useState("model"); // "model" | "display" | "data"

  // Settings State loaded from localStorage
  const [model, setModel] = useState("ion");
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem("mira-temperature");
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [systemPrompt, setSystemPrompt] = useState(() => {
    return localStorage.getItem("mira-system-prompt") || "You are MIRA, a helpful, precise, and encyclopedic AI assistant.";
  });
  const [maxTokens, setMaxTokens] = useState(() => {
    const saved = localStorage.getItem("mira-max-tokens");
    return saved !== null ? parseInt(saved, 10) : 400;
  });
  const [showImages, setShowImages] = useState(() => {
    const saved = localStorage.getItem("mira-show-images");
    return saved !== null ? saved === "true" : true;
  });
  const [streamTyping, setStreamTyping] = useState(() => {
    const saved = localStorage.getItem("mira-stream-typing");
    return saved !== null ? saved === "true" : true;
  });
  const [autoScroll, setAutoScroll] = useState(() => {
    const saved = localStorage.getItem("mira-autoscroll");
    return saved !== null ? saved === "true" : true;
  });

  // UI feedback states
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Refresh current values when modal opens
      const savedTemp = localStorage.getItem("mira-temperature");
      if (savedTemp !== null) setTemperature(parseFloat(savedTemp));

      const savedPrompt = localStorage.getItem("mira-system-prompt");
      if (savedPrompt) setSystemPrompt(savedPrompt);

      const savedTokens = localStorage.getItem("mira-max-tokens");
      if (savedTokens !== null) setMaxTokens(parseInt(savedTokens, 10));

      const savedImg = localStorage.getItem("mira-show-images");
      if (savedImg !== null) setShowImages(savedImg === "true");

      const savedStream = localStorage.getItem("mira-stream-typing");
      if (savedStream !== null) setStreamTyping(savedStream === "true");

      const savedScroll = localStorage.getItem("mira-autoscroll");
      if (savedScroll !== null) setAutoScroll(savedScroll === "true");

      setShowClearConfirm(false);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    // Persist all settings
    localStorage.setItem("mira-model", "ion");
    localStorage.setItem("mira-temperature", String(temperature));
    localStorage.setItem("mira-system-prompt", systemPrompt);
    localStorage.setItem("mira-max-tokens", String(maxTokens));
    localStorage.setItem("mira-show-images", String(showImages));
    localStorage.setItem("mira-stream-typing", String(streamTyping));
    localStorage.setItem("mira-autoscroll", String(autoScroll));

    // Dispatch global event for all components
    window.dispatchEvent(new Event("mira-settings-changed"));

    if (onSave) {
      onSave({
        model: "ion",
        temperature,
        systemPrompt,
        maxTokens,
        showImages,
        streamTyping,
        autoScroll
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setTemperature(0.7);
    setSystemPrompt("You are MIRA, a helpful, precise, and encyclopedic AI assistant.");
    setMaxTokens(400);
    setShowImages(true);
    setStreamTyping(true);
    setAutoScroll(true);
  };

  const handleExportChats = () => {
    const chats = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mira-chat-")) {
        try {
          chats[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          chats[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(chats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mira-chat-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTempDescription = (val) => {
    if (val <= 0.3) return "Precise & Deterministic";
    if (val <= 0.8) return "Balanced & Factual (Default)";
    return "Creative & Exploratory";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h2>Settings</h2>
            <span className="settings-badge">MIRA Engine v1</span>
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Close settings">
            <FiX size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "model" ? "active" : ""}`}
            onClick={() => setActiveTab("model")}
          >
            <FiCpu size={15} /> Model & Intelligence
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "display" ? "active" : ""}`}
            onClick={() => setActiveTab("display")}
          >
            <FiEye size={15} /> Interface & Media
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "data" ? "active" : ""}`}
            onClick={() => setActiveTab("data")}
          >
            <FiDatabase size={15} /> Data & History
          </button>
        </div>

        {/* Body Content */}
        <div className="modal-body custom-scrollbar">
          {/* TAB 1: MODEL & INTELLIGENCE */}
          {activeTab === "model" && (
            <div className="tab-pane">
              {/* Model Selection */}
              <div className="form-group">
                <div className="label-row">
                  <label>Active Model</label>
                  <span className="active-model-tag">Only Ion Available Locally</span>
                </div>
                <select
                  value="ion"
                  disabled
                  className="model-select-disabled"
                >
                  <option value="ion">Ion - Ultra Flash (Local PyTorch Engine - Active)</option>
                  <option value="spark" disabled>Spark - Fast (Cloud Offline)</option>
                  <option value="quantum" disabled>Quantum - Deep Reasoning (Cloud Offline)</option>
                  <option value="neutron" disabled>Neutron - Balanced (Cloud Offline)</option>
                  <option value="cosmos" disabled>Cosmos - Advanced (Cloud Offline)</option>
                  <option value="singularity" disabled>Singularity - Maximum (Cloud Offline)</option>
                </select>
                <div className="model-info-card">
                  <div className="model-info-dot" />
                  <div className="model-info-text">
                    <strong>Ion Transformer (ion.pt)</strong>: 50,257 vocab | 6 transformer layers | 384 embedding | Bi-LSTM neural reranker active.
                  </div>
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="form-group">
                <div className="label-row">
                  <label>Temperature: <span className="val-highlight">{temperature.toFixed(2)}</span></label>
                  <span className="temp-badge">{getTempDescription(temperature)}</span>
                </div>
                <div className="range-slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="styled-slider"
                  />
                  <div className="slider-ticks">
                    <span>0.0 (Strict)</span>
                    <span>0.7 (Default)</span>
                    <span>1.5 (Creative)</span>
                  </div>
                </div>
              </div>

              {/* Max Generation Length */}
              <div className="form-group">
                <div className="label-row">
                  <label>Response Length Budget</label>
                  <span className="val-highlight">{maxTokens} tokens</span>
                </div>
                <div className="token-pills">
                  {[
                    { val: 200, label: "Concise (200)" },
                    { val: 400, label: "Standard (400)" },
                    { val: 650, label: "Detailed (650)" },
                    { val: 900, label: "Comprehensive (900)" }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      className={`pill-btn ${maxTokens === item.val ? "active" : ""}`}
                      onClick={() => setMaxTokens(item.val)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* System Prompt / Persona */}
              <div className="form-group">
                <div className="label-row">
                  <label>System Persona & Directives</label>
                  <span className="hint-label">Conditions neural generation</span>
                </div>
                <div className="preset-chips">
                  {PRESET_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="preset-chip"
                      onClick={() => setSystemPrompt(p.prompt)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Set custom AI instructions or behavioral directives..."
                  className="styled-textarea"
                />
              </div>
            </div>
          )}

          {/* TAB 2: INTERFACE & MEDIA */}
          {activeTab === "display" && (
            <div className="tab-pane">
              <div className="toggle-item">
                <div className="toggle-text">
                  <div className="toggle-title">Show Encyclopedic Media</div>
                  <div className="toggle-desc">
                    Display authenticated Wikimedia Commons & Wikipedia images alongside topic responses.
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showImages}
                    onChange={(e) => setShowImages(e.target.checked)}
                  />
                  <span className="slider round" />
                </label>
              </div>

              <div className="toggle-item">
                <div className="toggle-text">
                  <div className="toggle-title">Smooth Stream Typing</div>
                  <div className="toggle-desc">
                    Simulate real-time typewriter character rendering for organic response synthesis.
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={streamTyping}
                    onChange={(e) => setStreamTyping(e.target.checked)}
                  />
                  <span className="slider round" />
                </label>
              </div>

              <div className="toggle-item">
                <div className="toggle-text">
                  <div className="toggle-title">Auto-scroll during Output</div>
                  <div className="toggle-desc">
                    Automatically keep the response window scrolled to the latest text generation.
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                  <span className="slider round" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: DATA & HISTORY */}
          {activeTab === "data" && (
            <div className="tab-pane">
              {/* Backup & Export */}
              <div className="action-row-card">
                <div>
                  <div className="action-title">Export Chat History</div>
                  <div className="action-desc">Download all your local conversations as a JSON backup file.</div>
                </div>
                <button
                  type="button"
                  onClick={handleExportChats}
                  className="secondary-action-btn"
                >
                  <FiDownload size={14} /> Export Backup
                </button>
              </div>

              {/* Reset to Defaults */}
              <div className="action-row-card">
                <div>
                  <div className="action-title">Restore Default Parameters</div>
                  <div className="action-desc">Revert temperature (0.7), system prompt, and interface toggles.</div>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="secondary-action-btn"
                >
                  <FiRefreshCw size={14} /> Reset Defaults
                </button>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone-card">
                <div className="danger-header">
                  <FiAlertTriangle className="danger-icon" size={18} />
                  <div>
                    <div className="danger-title">Danger Zone</div>
                    <div className="danger-desc">
                      Permanently wipes all saved conversation history, dynamic topic plates, and message caches.
                    </div>
                  </div>
                </div>

                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="danger-btn"
                  >
                    <FiTrash2 size={15} /> Clear All Chat History
                  </button>
                ) : (
                  <div className="confirm-box">
                    <p>Are you sure? This cannot be undone.</p>
                    <div className="confirm-buttons">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="cancel-confirm-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowClearConfirm(false);
                          if (onClearHistory) onClearHistory();
                        }}
                        className="confirm-delete-btn"
                      >
                        Yes, Delete Everything
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleSaveAll} className="save-btn">
            {savedSuccess ? (
              <>
                <FiCheck size={16} /> Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
