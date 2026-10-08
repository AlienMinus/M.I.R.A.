import { FiPlus, FiAlertCircle } from "react-icons/fi";

function stringToHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/);
  if (!parts.length || !parts[0]) return "RM";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfilesStrip({
  profiles,
  activeProfileId,
  onSelectProfile,
  onNewProfile,
  onDeleteProfile,
  deleteConfirmId,
  setDeleteConfirmId
}) {
  return (
    <>
      <div className="profiles-strip no-print">
        <span className="profiles-strip-label">Profiles:</span>
        <div className="profiles-list-scroll custom-scrollbar">
          {profiles.map((p) => {
            const name = p.header?.name || "Untitled";
            const initials = getInitials(name);
            const hue = stringToHue(name);
            const bgGrad = `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 45) % 360}, 75%, 40%))`;
            const isActive = p.id === activeProfileId;

            return (
              <div
                key={p.id}
                className={`profile-chip ${isActive ? "active" : ""}`}
                onClick={() => onSelectProfile(p.id)}
              >
                <div className="profile-chip-avatar" style={{ background: bgGrad }}>
                  {initials}
                </div>
                <span className="profile-chip-name">{name}</span>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    className="profile-chip-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(p.id);
                    }}
                    title="Delete profile"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="profile-chip-add"
            onClick={onNewProfile}
            title="Create new profile"
          >
            <FiPlus size={13} /> New Profile
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="delete-modal-overlay no-print"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div className="delete-modal-box" onClick={(e) => e.stopPropagation()}>
            <FiAlertCircle className="delete-modal-icon" size={28} />
            <h3>Delete this resume profile?</h3>
            <p>This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={() => onDeleteProfile(deleteConfirmId)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

