import { FiCamera, FiTrash2, FiPlus } from "react-icons/fi";

export default function HeaderEditor({
  header = {},
  onChange,
  onPhotoUploadClick,
  onRemovePhoto
}) {
  const updateField = (key, val) => {
    onChange({ ...header, [key]: val });
  };

  const contactList = header.contact || [];

  const handleContactChange = (index, field, value) => {
    const next = [...contactList];
    next[index] = { ...next[index], [field]: value };
    onChange({ ...header, contact: next });
  };

  const handleAddContact = () => {
    onChange({
      ...header,
      contact: [...contactList, { text: "", link: "" }]
    });
  };

  const handleRemoveContact = (index) => {
    const next = contactList.filter((_, i) => i !== index);
    onChange({ ...header, contact: next });
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Header Information</h3>
      </div>

      <div className="grid-2-col">
        <div className="field-group">
          <label>Full Name</label>
          <input
            type="text"
            value={header.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Manas Ranjan Das"
          />
        </div>
        <div className="field-group">
          <label>Location</label>
          <input
            type="text"
            value={header.location || ""}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="City, State, Country"
          />
        </div>
      </div>

      {/* Passport Photo in Editor */}
      <div className="editor-photo-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={Boolean(header.showPhoto)}
            onChange={(e) => updateField("showPhoto", e.target.checked)}
          />
          <span>Include Passport Photo on Resume</span>
        </label>

        {header.showPhoto && (
          <div className="photo-preview-admin">
            {header.photo ? (
              <div className="admin-photo-thumb">
                <img src={header.photo} alt="Passport Preview" />
              </div>
            ) : (
              <div className="admin-photo-placeholder">
                <FiCamera size={18} />
              </div>
            )}
            <div className="photo-btn-group">
              <button
                type="button"
                className="photo-btn blue"
                onClick={onPhotoUploadClick}
              >
                <FiCamera size={12} /> {header.photo ? "Change Photo" : "Upload Photo"}
              </button>
              {header.photo && (
                <button
                  type="button"
                  className="photo-btn red"
                  onClick={onRemovePhoto}
                >
                  <FiTrash2 size={12} /> Remove
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Links */}
      <div className="sub-section">
        <div className="sub-section-header">
          <label className="sub-label">Contact & Portfolio Links</label>
          <button
            type="button"
            className="add-sub-btn"
            onClick={handleAddContact}
          >
            <FiPlus size={12} /> Add Link
          </button>
        </div>
        {contactList.map((c, i) => (
          <div key={i} className="link-item-row">
            <input
              type="text"
              value={c.text || ""}
              placeholder="Display text (e.g. email, github.com/...)"
              onChange={(e) => handleContactChange(i, "text", e.target.value)}
            />
            <input
              type="text"
              value={c.link || ""}
              placeholder="URL link (e.g. https://... or mailto:...)"
              onChange={(e) => handleContactChange(i, "link", e.target.value || null)}
            />
            <button
              type="button"
              className="row-del-btn"
              onClick={() => handleRemoveContact(i)}
              title="Remove contact link"
            >
              <FiTrash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

