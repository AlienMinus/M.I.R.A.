import { FiZap } from "react-icons/fi";

export default function SummaryEditor({ summary = "", onChange, onAiPolish }) {
  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Professional Summary</h3>
        <button
          type="button"
          className="ai-polish-btn"
          onClick={onAiPolish}
          title="Enhance summary with AI polish"
        >
          <FiZap size={13} /> AI Polish
        </button>
      </div>
      <textarea
        rows={6}
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Summary statement (HTML tags like <strong> are supported)..."
      />
    </div>
  );
}

