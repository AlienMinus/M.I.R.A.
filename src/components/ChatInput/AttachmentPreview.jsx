import { FiX, FiLoader } from "react-icons/fi";
import { FaFile } from "react-icons/fa6";
import "./ChatInput.css";

export default function AttachmentPreview({ files, onRemove }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="file-preview-container">
      {files.map((fileObj) => (
        <div key={fileObj.id} className="file-preview-item">
          {fileObj.loading ? (
            <FiLoader className="file-spinner" />
          ) : (
            <div className="file-icon">
              <FaFile />
            </div>
          )}
          <div className="file-info">
            <span className="file-name" title={fileObj.file.name}>
              {fileObj.file.name}
            </span>
            <span className="file-size">
              {(fileObj.file.size / 1024).toFixed(0)} KB
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(fileObj.id)}
              className="remove-file-btn"
              aria-label="Remove file"
            >
              <FiX />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
