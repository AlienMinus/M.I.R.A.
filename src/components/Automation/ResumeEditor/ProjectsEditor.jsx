import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function ProjectsEditor({ projects = [], onChange }) {
  const handleAddProject = () => {
    onChange([
      ...projects,
      {
        title: "Project Name",
        tech: "Technologies used",
        year: "2026",
        link: "",
        details: ["Feature description..."]
      }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    const next = [...projects];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleDetailsChange = (index, textValue) => {
    const lines = textValue.split("\n");
    handleUpdate(index, "details", lines);
  };

  const handleRemove = (index) => {
    onChange(projects.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Top Projects</h3>
        <button
          type="button"
          className="add-sub-btn"
          onClick={handleAddProject}
        >
          <FiPlus size={12} /> Add Project
        </button>
      </div>

      {projects.map((proj, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-num">Project #{i + 1}</span>
            <button
              type="button"
              className="row-del-btn"
              onClick={() => handleRemove(i)}
              title="Remove project"
            >
              <FiTrash2 size={13} />
            </button>
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Project Title</label>
              <input
                type="text"
                value={proj.title || ""}
                placeholder="Project Title"
                onChange={(e) => handleUpdate(i, "title", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Year</label>
              <input
                type="text"
                value={proj.year || ""}
                placeholder="2026"
                onChange={(e) => handleUpdate(i, "year", e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Tech Stack</label>
              <input
                type="text"
                value={proj.tech || ""}
                placeholder="React, Node.js, Express, MongoDB..."
                onChange={(e) => handleUpdate(i, "tech", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Live URL / Repo</label>
              <input
                type="text"
                value={proj.link || ""}
                placeholder="https://..."
                onChange={(e) => handleUpdate(i, "link", e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Bullets / Highlights (one per line)</label>
            <textarea
              rows={3}
              value={(proj.details || []).join("\n")}
              onChange={(e) => handleDetailsChange(i, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

