import {
  FiEye,
  FiEdit3,
  FiColumns,
  FiDownload,
  FiUpload,
  FiCopy,
  FiCamera
} from "react-icons/fi";

export default function Toolbar({
  activeView,
  setActiveView,
  showPhoto,
  onTogglePhoto,
  onImportClick,
  onExportJson,
  onDuplicateProfile,
  onOpenPdfModal
}) {
  return (
    <div className="resumanager-top-bar no-print">
      {/* Left: View Modes & Photo toggle */}
      <div className="top-bar-left">
        <div className="view-mode-pill">
          <button
            type="button"
            className={`mode-btn ${activeView === "split" ? "active" : ""}`}
            onClick={() => setActiveView("split")}
            title="Side-by-side Form Editor & ATS Preview"
          >
            <FiColumns size={13} /> Split View
          </button>
          <button
            type="button"
            className={`mode-btn ${activeView === "resume" ? "active" : ""}`}
            onClick={() => setActiveView("resume")}
            title="Full-page ATS Resume View"
          >
            <FiEye size={13} /> View Resume
          </button>
          <button
            type="button"
            className={`mode-btn ${activeView === "admin" ? "active" : ""}`}
            onClick={() => setActiveView("admin")}
            title="Full-page Data Form Editor"
          >
            <FiEdit3 size={13} /> Edit / Admin
          </button>
        </div>

        {/* Passport Photo Checkbox */}
        <label className="passport-toggle-pill">
          <input
            type="checkbox"
            checked={Boolean(showPhoto)}
            onChange={(e) => onTogglePhoto(e.target.checked)}
          />
          <FiCamera size={13} />
          <span>Passport Photo</span>
        </label>
      </div>

      {/* Right: Actions */}
      <div className="top-bar-right">
        <button
          type="button"
          className="action-btn-ghost"
          onClick={onImportClick}
          title="Import custom JSON resume"
        >
          <FiUpload size={13} /> Import JSON
        </button>
        <button
          type="button"
          className="action-btn-ghost"
          onClick={onExportJson}
          title="Download resume as JSON"
        >
          <FiDownload size={13} /> JSON
        </button>
        <button
          type="button"
          className="action-btn-ghost"
          onClick={onDuplicateProfile}
          title="Clone current profile"
        >
          <FiCopy size={13} /> Duplicate
        </button>
        <button
          type="button"
          className="action-btn-primary"
          onClick={onOpenPdfModal}
          title="Configure and Download PDF"
        >
          <FiDownload size={14} /> Download PDF
        </button>
      </div>
    </div>
  );
}

