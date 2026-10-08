import { FiZap, FiLoader } from "react-icons/fi";

export default function SummaryEditor({
  summary = "",
  onChange,
  onAiPolish,
  isPolishing = false
}) {
  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Professional Summary</h3>
        <button
          type="button"
          className={`ai-polish-btn ${isPolishing ? "is-loading" : ""}`}
          onClick={onAiPolish}
          disabled={isPolishing}
          title={isPolishing ? "Polishing with AI..." : "Enhance summary with AI polish"}
        >
          {isPolishing ? (
            <>
              <FiLoader size={13} className="animate-spin" /> Polishing…
            </>
          ) : (
            <>
              <FiZap size={13} /> AI Polish
            </>
          )}
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

