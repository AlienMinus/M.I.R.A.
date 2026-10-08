import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function AchievementsEditor({ achievements = [], onChange }) {
  const handleAddAchievement = () => {
    onChange([
      ...achievements,
      { label: "Achievement", description: "Details..." }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    const next = [...achievements];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleRemove = (index) => {
    onChange(achievements.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Achievements & Leadership</h3>
        <button
          type="button"
          className="add-sub-btn"
          onClick={handleAddAchievement}
        >
          <FiPlus size={12} /> Add Achievement
        </button>
      </div>

      {achievements.map((ach, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-num">Achievement #{i + 1}</span>
            <button
              type="button"
              className="row-del-btn"
              onClick={() => handleRemove(i)}
              title="Remove achievement"
            >
              <FiTrash2 size={13} />
            </button>
          </div>

          <div className="field-group">
            <label>Label</label>
            <input
              type="text"
              value={ach.label || ""}
              placeholder="e.g. BPUT Tech Carnival 2025 Winner"
              onChange={(e) => handleUpdate(i, "label", e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Description (supports HTML formatting)</label>
            <input
              type="text"
              value={ach.description || ""}
              placeholder="e.g. Secured 1st position among 50+ regional engineering teams."
              onChange={(e) => handleUpdate(i, "description", e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

