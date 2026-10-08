import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function SkillsEditor({ skills = [], onChange }) {
  const handleAddCategory = () => {
    onChange([...skills, { category: "New Category", items: "" }]);
  };

  const handleUpdate = (index, field, value) => {
    const next = [...skills];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleRemove = (index) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Technical Skills</h3>
        <button
          type="button"
          className="add-sub-btn"
          onClick={handleAddCategory}
        >
          <FiPlus size={12} /> Add Category
        </button>
      </div>

      {skills.map((sk, i) => (
        <div key={i} className="link-item-row">
          <input
            type="text"
            value={sk.category || ""}
            placeholder="Category (e.g. Languages, Web/Dev, AI)"
            style={{ width: "38%" }}
            onChange={(e) => handleUpdate(i, "category", e.target.value)}
          />
          <input
            type="text"
            value={sk.items || ""}
            placeholder="Items (comma-separated, e.g. Python, C++, React)"
            style={{ flex: 1 }}
            onChange={(e) => handleUpdate(i, "items", e.target.value)}
          />
          <button
            type="button"
            className="row-del-btn"
            onClick={() => handleRemove(i)}
            title="Remove category"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

