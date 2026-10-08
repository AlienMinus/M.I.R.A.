import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function ExperienceEditor({ experience = [], onChange }) {
  const handleAddExperience = () => {
    onChange([
      ...experience,
      {
        role: "Job Title | Organization",
        link: "",
        period: "Date Range",
        details: ["Key accomplishment..."]
      }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    const next = [...experience];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleDetailsChange = (index, textValue) => {
    const lines = textValue.split("\n");
    handleUpdate(index, "details", lines);
  };

  const handleRemove = (index) => {
    onChange(experience.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Work Experience</h3>
        <button
          type="button"
          className="add-sub-btn"
          onClick={handleAddExperience}
        >
          <FiPlus size={12} /> Add Experience
        </button>
      </div>

      {experience.map((exp, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-num">Role #{i + 1}</span>
            <button
              type="button"
              className="row-del-btn"
              onClick={() => handleRemove(i)}
              title="Remove role"
            >
              <FiTrash2 size={13} />
            </button>
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Role & Organization</label>
              <input
                type="text"
                value={exp.role || ""}
                placeholder="Role | Organization"
                onChange={(e) => handleUpdate(i, "role", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Period / Duration</label>
              <input
                type="text"
                value={exp.period || ""}
                placeholder="May 2026 — June 2026"
                onChange={(e) => handleUpdate(i, "period", e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Public Verification Link (Optional)</label>
            <input
              type="text"
              value={exp.link || ""}
              placeholder="https://linkedin.com/..."
              onChange={(e) => handleUpdate(i, "link", e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Details & Bullet Points (one per line, supports &lt;strong&gt;)</label>
            <textarea
              rows={3}
              value={(exp.details || []).join("\n")}
              onChange={(e) => handleDetailsChange(i, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

