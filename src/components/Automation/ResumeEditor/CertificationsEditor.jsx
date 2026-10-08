import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function CertificationsEditor({ certifications = [], onChange }) {
  const handleAddCertification = () => {
    onChange([
      ...certifications,
      { name: "Certification Name", issuer: "Issuer", year: "2024", link: "", details: "" }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    const next = [...certifications];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleRemove = (index) => {
    onChange(certifications.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Certifications</h3>
        <button
          type="button"
          className="add-sub-btn"
          onClick={handleAddCertification}
        >
          <FiPlus size={12} /> Add Certification
        </button>
      </div>

      {certifications.map((cert, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-num">Certification #{i + 1}</span>
            <button
              type="button"
              className="row-del-btn"
              onClick={() => handleRemove(i)}
              title="Remove certification"
            >
              <FiTrash2 size={13} />
            </button>
          </div>

          <div className="field-group">
            <label>Certification Name</label>
            <input
              type="text"
              value={cert.name || ""}
              onChange={(e) => handleUpdate(i, "name", e.target.value)}
            />
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Issuer</label>
              <input
                type="text"
                value={cert.issuer || ""}
                placeholder="AWS, Google, Coursera..."
                onChange={(e) => handleUpdate(i, "issuer", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Year</label>
              <input
                type="text"
                value={cert.year || ""}
                placeholder="2024"
                onChange={(e) => handleUpdate(i, "year", e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Verification Link (Optional)</label>
              <input
                type="text"
                value={cert.link || ""}
                placeholder="https://..."
                onChange={(e) => handleUpdate(i, "link", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Details / Credential ID</label>
              <input
                type="text"
                value={cert.details || ""}
                placeholder="ID: ABC-12345"
                onChange={(e) => handleUpdate(i, "details", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

