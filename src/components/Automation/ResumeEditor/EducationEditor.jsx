import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function EducationEditor({ education = [], onChange }) {
  const handleAddEducation = () => {
    onChange([
      ...education,
      { institution: "", period: "", degree: "", score: "" }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    const next = [...education];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleRemove = (index) => {
    onChange(education.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <div className="card-header-row">
        <h3 className="card-title">Education</h3>
        <button
          type="button"
          className="add-sub-btn"
          onClick={handleAddEducation}
        >
          <FiPlus size={12} /> Add Education
        </button>
      </div>

      {education.map((edu, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-num">Education #{i + 1}</span>
            <button
              type="button"
              className="row-del-btn"
              onClick={() => handleRemove(i)}
              title="Remove education"
            >
              <FiTrash2 size={13} />
            </button>
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Institution / University</label>
              <input
                type="text"
                value={edu.institution || ""}
                onChange={(e) => handleUpdate(i, "institution", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Period / Year</label>
              <input
                type="text"
                value={edu.period || ""}
                placeholder="2023 — 2027"
                onChange={(e) => handleUpdate(i, "period", e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Degree / Major</label>
              <input
                type="text"
                value={edu.degree || ""}
                placeholder="Bachelor of Technology..."
                onChange={(e) => handleUpdate(i, "degree", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Score / CGPA</label>
              <input
                type="text"
                value={edu.score || ""}
                placeholder="CGPA: 8.88 / 10.00"
                onChange={(e) => handleUpdate(i, "score", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

