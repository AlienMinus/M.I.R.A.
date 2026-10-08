import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function CustomSectionsEditor({ customSections = [], onChange }) {
  const handleAddSection = () => {
    onChange([
      ...customSections,
      { title: "Custom Section", items: ["Item 1..."] }
    ]);
  };

  const handleUpdateTitle = (index, title) => {
    const next = [...customSections];
    next[index] = { ...next[index], title };
    onChange(next);
  };

  const handleUpdateItems = (index, textValue) => {
    const lines = textValue.split("\n");
    const next = [...customSections];
    next[index] = { ...next[index], items: lines };
    onChange(next);
  };

  const handleRemove = (index) => {
    onChange(customSections.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Custom Sections</h3>
        <button
          type="button"
          className="add-sub-btn"
          onClick={handleAddSection}
        >
          <FiPlus size={12} /> Add Custom Section
        </button>
      </div>

      {customSections.map((sec, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-num">Section #{i + 1}</span>
            <button
              type="button"
              className="row-del-btn"
              onClick={() => handleRemove(i)}
              title="Remove section"
            >
              <FiTrash2 size={13} />
            </button>
          </div>

          <div className="field-group">
            <label>Section Title</label>
            <input
              type="text"
              value={sec.title || ""}
              placeholder="e.g. Publications, Volunteer Work, Languages"
              onChange={(e) => handleUpdateTitle(i, e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Bullet Points / Items (one per line)</label>
            <textarea
              rows={3}
              value={(sec.items || []).join("\n")}
              onChange={(e) => handleUpdateItems(i, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

