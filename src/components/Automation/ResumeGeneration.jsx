import { useState, useEffect, useRef } from "react";
import {
  FiEye,
  FiEdit3,
  FiColumns,
  FiPlus,
  FiCopy,
  FiTrash2,
  FiSave,
  FiDownload,
  FiUpload,
  FiPrinter,
  FiCamera,
  FiExternalLink,
  FiCheck,
  FiZap,
  FiAlertCircle,
  FiFileText
} from "react-icons/fi";
import { DEFAULT_PROFILES } from "./defaultProfiles";
import "./Automation.css";

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

export default function ResumeGeneration() {
  // Profiles State
  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem("resume_profiles");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed reading resume_profiles from localStorage", e);
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    return profiles[0]?.id || "profile-engineering-default";
  });

  const [activeView, setActiveView] = useState("split"); // "split" | "resume" | "admin"
  const [toastMessage, setToastMessage] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [scale, setScale] = useState(100);
  const photoInputRef = useRef(null);
  const jsonImportRef = useRef(null);

  // Current active profile
  const currentProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

  // Save all profiles to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("resume_profiles", JSON.stringify(profiles));
    } catch (e) {
      console.error("Error saving resume_profiles", e);
    }
  }, [profiles]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2800);
  };

  // Profile management
  const updateCurrentProfile = (updater) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === currentProfile.id) {
          return typeof updater === "function" ? updater(p) : { ...p, ...updater };
        }
        return p;
      })
    );
  };

  const handleNewProfile = () => {
    const newId = `profile-${Date.now()}`;
    const newProf = {
      id: newId,
      header: {
        name: "New Profile",
        location: "City, Country",
        photo: "",
        showPhoto: false,
        contact: [
          { text: "email@example.com", link: "mailto:email@example.com" },
          { text: "+1 (555) 000-0000", link: null }
        ]
      },
      summary: "Describe your professional background and core value proposition here.",
      education: [
        { institution: "University Name", period: "2020 — 2024", degree: "Bachelor of Science", score: "GPA: 3.8 / 4.0" }
      ],
      skills: [
        { category: "Core Skills", items: "Skill 1, Skill 2, Skill 3" }
      ],
      experience: [
        {
          role: "Job Title | Company Name",
          link: "",
          period: "2022 — Present",
          details: ["Engineered scalable solutions and delivered key project milestones."]
        }
      ],
      projects: [
        {
          title: "Project Name",
          tech: "React, Python, Node.js",
          year: "2024",
          link: "",
          details: ["Built full-stack application with real-time capabilities."]
        }
      ],
      certifications: [],
      achievements: [],
      customSections: []
    };

    setProfiles((prev) => [...prev, newProf]);
    setActiveProfileId(newId);
    setActiveView("admin");
    showToast("Created new resume profile!");
  };

  const handleDuplicateProfile = () => {
    const newId = `profile-${Date.now()}`;
    const cloned = JSON.parse(JSON.stringify(currentProfile));
    cloned.id = newId;
    cloned.header.name = `${cloned.header.name || "Profile"} (Copy)`;

    setProfiles((prev) => [...prev, cloned]);
    setActiveProfileId(newId);
    showToast("Duplicated profile successfully!");
  };

  const handleDeleteProfile = (id) => {
    if (profiles.length <= 1) {
      showToast("Cannot delete the only profile.");
      return;
    }
    const filtered = profiles.filter((p) => p.id !== id);
    setProfiles(filtered);
    if (activeProfileId === id) {
      setActiveProfileId(filtered[0].id);
    }
    setDeleteConfirmId(null);
    showToast("Profile deleted.");
  };

  // Photo handlers
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      updateCurrentProfile((prev) => ({
        ...prev,
        header: {
          ...prev.header,
          photo: base64,
          showPhoto: true
        }
      }));
      showToast("Passport photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (e) => {
    e?.stopPropagation();
    updateCurrentProfile((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        photo: ""
      }
    }));
    showToast("Passport photo removed.");
  };

  const handleTogglePhoto = (enabled) => {
    updateCurrentProfile((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        showPhoto: enabled
      }
    }));
  };

  // AI Polish summary
  const handleAIEnhanceSummary = () => {
    const orig = currentProfile.summary || "";
    const polished = orig.trim()
      ? `${orig.trim()} Proven ability to architect resilient systems, lead high-velocity development squads, and deliver mission-critical software solutions.`
      : "High-impact software engineering professional with proven expertise across distributed systems, machine learning pipelines, and full-stack architecture.";
    updateCurrentProfile((prev) => ({ ...prev, summary: polished }));
    showToast("Summary enhanced with AI polish!");
  };

  // JSON Export / Import
  const handleDownloadJSON = () => {
    const cleanName = (currentProfile.header?.name || "resume").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const blob = new Blob([JSON.stringify(currentProfile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanName}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported resume data.json!");
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedId = `profile-${Date.now()}`;
        const normalized = {
          id: importedId,
          header: parsed.header || { name: "Imported Profile", location: "", contact: [] },
          summary: parsed.summary || "",
          education: Array.isArray(parsed.education) ? parsed.education : [],
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
          achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
          customSections: Array.isArray(parsed.customSections) ? parsed.customSections : []
        };
        setProfiles((prev) => [...prev, normalized]);
        setActiveProfileId(importedId);
        showToast("Profile imported successfully from JSON!");
      } catch (err) {
        showToast("Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="resumanager-app-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="resumanager-toast">
          <FiCheck className="toast-icon" /> {toastMessage}
        </div>
      )}

      {/* Hidden file pickers */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handlePhotoUpload}
      />
      <input
        type="file"
        ref={jsonImportRef}
        accept=".json"
        style={{ display: "none" }}
        onChange={handleImportJSON}
      />

      {/* Top Application Toolbar */}
      <div className="resumanager-top-bar no-print">
        {/* Left: Profile switcher & view modes */}
        <div className="top-bar-left">
          {/* View mode toggle */}
          <div className="view-mode-pill">
            <button
              type="button"
              className={`mode-btn ${activeView === "split" ? "active" : ""}`}
              onClick={() => setActiveView("split")}
              title="Side-by-side Form Editor & ATS Preview"
            >
              <FiColumns size={13} /> Split View
            </button>
            <button
              type="button"
              className={`mode-btn ${activeView === "resume" ? "active" : ""}`}
              onClick={() => setActiveView("resume")}
              title="Full-page ATS Resume View"
            >
              <FiEye size={13} /> View Resume
            </button>
            <button
              type="button"
              className={`mode-btn ${activeView === "admin" ? "active" : ""}`}
              onClick={() => setActiveView("admin")}
              title="Full-page Data Form Editor"
            >
              <FiEdit3 size={13} /> Edit / Admin
            </button>
          </div>

          {/* Passport Photo Checkbox */}
          <label className="passport-toggle-pill">
            <input
              type="checkbox"
              checked={Boolean(currentProfile.header?.showPhoto)}
              onChange={(e) => handleTogglePhoto(e.target.checked)}
            />
            <FiCamera size={13} />
            <span>Passport Photo</span>
          </label>
        </div>

        {/* Right: Actions */}
        <div className="top-bar-right">
          <button
            type="button"
            className="action-btn-ghost"
            onClick={() => jsonImportRef.current?.click()}
            title="Import custom JSON resume"
          >
            <FiUpload size={13} /> Import JSON
          </button>
          <button
            type="button"
            className="action-btn-ghost"
            onClick={handleDownloadJSON}
            title="Download resume as JSON"
          >
            <FiDownload size={13} /> JSON
          </button>
          <button
            type="button"
            className="action-btn-ghost"
            onClick={handleDuplicateProfile}
            title="Clone current profile"
          >
            <FiCopy size={13} /> Duplicate
          </button>
          <button
            type="button"
            className="action-btn-primary"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <FiPrinter size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Profiles Bar */}
      <div className="profiles-strip no-print">
        <span className="profiles-strip-label">Profiles:</span>
        <div className="profiles-list-scroll">
          {profiles.map((p) => {
            const name = p.header?.name || "Untitled";
            const initials = getInitials(name);
            const hue = stringToHue(name);
            const bgGrad = `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 45) % 360}, 75%, 40%))`;
            const isActive = p.id === currentProfile.id;

            return (
              <div
                key={p.id}
                className={`profile-chip ${isActive ? "active" : ""}`}
                onClick={() => setActiveProfileId(p.id)}
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
            onClick={handleNewProfile}
            title="Create new profile"
          >
            <FiPlus size={13} /> New Profile
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="delete-modal-overlay no-print" onClick={() => setDeleteConfirmId(null)}>
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
                onClick={() => handleDeleteProfile(deleteConfirmId)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className={`workspace-grid view-${activeView}`}>
        {/* =========================================================================
            ADMIN / FORM EDITOR (Visible in 'split' or 'admin' view)
            ========================================================================= */}
        {(activeView === "split" || activeView === "admin") && (
          <div className="editor-pane custom-scrollbar no-print">
            {/* 1. Header Information */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Header Information</h3>
              </div>
              <div className="grid-2-col">
                <div className="field-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={currentProfile.header?.name || ""}
                    onChange={(e) =>
                      updateCurrentProfile((prev) => ({
                        ...prev,
                        header: { ...prev.header, name: e.target.value }
                      }))
                    }
                    placeholder="e.g. Manas Ranjan Das"
                  />
                </div>
                <div className="field-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={currentProfile.header?.location || ""}
                    onChange={(e) =>
                      updateCurrentProfile((prev) => ({
                        ...prev,
                        header: { ...prev.header, location: e.target.value }
                      }))
                    }
                    placeholder="City, State, Country"
                  />
                </div>
              </div>

              {/* Passport Photo in Editor */}
              <div className="editor-photo-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(currentProfile.header?.showPhoto)}
                    onChange={(e) => handleTogglePhoto(e.target.checked)}
                  />
                  <span>Include Passport Photo on Resume</span>
                </label>

                {currentProfile.header?.showPhoto && (
                  <div className="photo-preview-admin">
                    {currentProfile.header?.photo ? (
                      <div className="admin-photo-thumb">
                        <img src={currentProfile.header.photo} alt="Passport Preview" />
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
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <FiCamera size={12} /> {currentProfile.header?.photo ? "Change Photo" : "Upload Photo"}
                      </button>
                      {currentProfile.header?.photo && (
                        <button
                          type="button"
                          className="photo-btn red"
                          onClick={handleRemovePhoto}
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
                    onClick={() =>
                      updateCurrentProfile((prev) => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          contact: [...(prev.header?.contact || []), { text: "", link: "" }]
                        }
                      }))
                    }
                  >
                    <FiPlus size={12} /> Add Link
                  </button>
                </div>
                {(currentProfile.header?.contact || []).map((c, i) => (
                  <div key={i} className="link-item-row">
                    <input
                      type="text"
                      value={c.text || ""}
                      placeholder="Display text (e.g. github.com/user or phone)"
                      onChange={(e) => {
                        const next = [...currentProfile.header.contact];
                        next[i] = { ...next[i], text: e.target.value };
                        updateCurrentProfile((prev) => ({
                          ...prev,
                          header: { ...prev.header, contact: next }
                        }));
                      }}
                    />
                    <input
                      type="text"
                      value={c.link || ""}
                      placeholder="URL link (e.g. https://... or mailto:...)"
                      onChange={(e) => {
                        const next = [...currentProfile.header.contact];
                        next[i] = { ...next[i], link: e.target.value || null };
                        updateCurrentProfile((prev) => ({
                          ...prev,
                          header: { ...prev.header, contact: next }
                        }));
                      }}
                    />
                    <button
                      type="button"
                      className="row-del-btn"
                      onClick={() => {
                        const next = currentProfile.header.contact.filter((_, idx) => idx !== i);
                        updateCurrentProfile((prev) => ({
                          ...prev,
                          header: { ...prev.header, contact: next }
                        }));
                      }}
                      title="Remove contact link"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Professional Summary</h3>
                <button
                  type="button"
                  className="ai-polish-btn"
                  onClick={handleAIEnhanceSummary}
                >
                  <FiZap size={13} /> AI Polish
                </button>
              </div>
              <textarea
                rows={4}
                value={currentProfile.summary || ""}
                onChange={(e) => updateCurrentProfile((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="Summary statement (HTML tags like <strong> are supported)..."
              />
            </div>

            {/* 3. Education */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Education</h3>
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() =>
                    updateCurrentProfile((prev) => ({
                      ...prev,
                      education: [
                        ...(prev.education || []),
                        { institution: "", period: "", degree: "", score: "" }
                      ]
                    }))
                  }
                >
                  <FiPlus size={12} /> Add Education
                </button>
              </div>
              {(currentProfile.education || []).map((edu, i) => (
                <div key={i} className="entry-card">
                  <div className="entry-card-header">
                    <span className="entry-num">Education #{i + 1}</span>
                    <button
                      type="button"
                      className="row-del-btn"
                      onClick={() => {
                        const next = currentProfile.education.filter((_, idx) => idx !== i);
                        updateCurrentProfile((prev) => ({ ...prev, education: next }));
                      }}
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
                        onChange={(e) => {
                          const next = [...currentProfile.education];
                          next[i] = { ...next[i], institution: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, education: next }));
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label>Period / Year</label>
                      <input
                        type="text"
                        value={edu.period || ""}
                        placeholder="2023 — 2027"
                        onChange={(e) => {
                          const next = [...currentProfile.education];
                          next[i] = { ...next[i], period: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, education: next }));
                        }}
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
                        onChange={(e) => {
                          const next = [...currentProfile.education];
                          next[i] = { ...next[i], degree: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, education: next }));
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label>Score / CGPA</label>
                      <input
                        type="text"
                        value={edu.score || ""}
                        placeholder="CGPA: 8.88 / 10.00"
                        onChange={(e) => {
                          const next = [...currentProfile.education];
                          next[i] = { ...next[i], score: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, education: next }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Skills */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Technical Skills</h3>
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() =>
                    updateCurrentProfile((prev) => ({
                      ...prev,
                      skills: [...(prev.skills || []), { category: "New Category", items: "" }]
                    }))
                  }
                >
                  <FiPlus size={12} /> Add Category
                </button>
              </div>
              {(currentProfile.skills || []).map((sk, i) => (
                <div key={i} className="link-item-row">
                  <input
                    type="text"
                    value={sk.category || ""}
                    placeholder="Category (e.g. Languages, Web/Dev, AI)"
                    style={{ width: "38%" }}
                    onChange={(e) => {
                      const next = [...currentProfile.skills];
                      next[i] = { ...next[i], category: e.target.value };
                      updateCurrentProfile((prev) => ({ ...prev, skills: next }));
                    }}
                  />
                  <input
                    type="text"
                    value={sk.items || ""}
                    placeholder="Items (comma-separated, e.g. Python, C++, React)"
                    style={{ flex: 1 }}
                    onChange={(e) => {
                      const next = [...currentProfile.skills];
                      next[i] = { ...next[i], items: e.target.value };
                      updateCurrentProfile((prev) => ({ ...prev, skills: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="row-del-btn"
                    onClick={() => {
                      const next = currentProfile.skills.filter((_, idx) => idx !== i);
                      updateCurrentProfile((prev) => ({ ...prev, skills: next }));
                    }}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* 5. Work Experience */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Work Experience</h3>
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() =>
                    updateCurrentProfile((prev) => ({
                      ...prev,
                      experience: [
                        ...(prev.experience || []),
                        { role: "Intern | Organization", link: "", period: "Date Range", details: ["Key accomplishment..."] }
                      ]
                    }))
                  }
                >
                  <FiPlus size={12} /> Add Experience
                </button>
              </div>
              {(currentProfile.experience || []).map((exp, i) => (
                <div key={i} className="entry-card">
                  <div className="entry-card-header">
                    <span className="entry-num">Role #{i + 1}</span>
                    <button
                      type="button"
                      className="row-del-btn"
                      onClick={() => {
                        const next = currentProfile.experience.filter((_, idx) => idx !== i);
                        updateCurrentProfile((prev) => ({ ...prev, experience: next }));
                      }}
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
                        onChange={(e) => {
                          const next = [...currentProfile.experience];
                          next[i] = { ...next[i], role: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, experience: next }));
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label>Period / Duration</label>
                      <input
                        type="text"
                        value={exp.period || ""}
                        placeholder="May 2026 — June 2026"
                        onChange={(e) => {
                          const next = [...currentProfile.experience];
                          next[i] = { ...next[i], period: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, experience: next }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Public Verification Link (Optional)</label>
                    <input
                      type="text"
                      value={exp.link || ""}
                      placeholder="https://linkedin.com/..."
                      onChange={(e) => {
                        const next = [...currentProfile.experience];
                        next[i] = { ...next[i], link: e.target.value };
                        updateCurrentProfile((prev) => ({ ...prev, experience: next }));
                      }}
                    />
                  </div>
                  <div className="field-group">
                    <label>Details & Bullet Points (one per line, supports &lt;strong&gt;)</label>
                    <textarea
                      rows={3}
                      value={(exp.details || []).join("\n")}
                      onChange={(e) => {
                        const lines = e.target.value.split("\n");
                        const next = [...currentProfile.experience];
                        next[i] = { ...next[i], details: lines };
                        updateCurrentProfile((prev) => ({ ...prev, experience: next }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 6. Top Projects */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Top Projects</h3>
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() =>
                    updateCurrentProfile((prev) => ({
                      ...prev,
                      projects: [
                        ...(prev.projects || []),
                        { title: "Project Name", tech: "Technologies used", year: "2026", link: "", details: ["Feature description..."] }
                      ]
                    }))
                  }
                >
                  <FiPlus size={12} /> Add Project
                </button>
              </div>
              {(currentProfile.projects || []).map((proj, i) => (
                <div key={i} className="entry-card">
                  <div className="entry-card-header">
                    <span className="entry-num">Project #{i + 1}</span>
                    <button
                      type="button"
                      className="row-del-btn"
                      onClick={() => {
                        const next = currentProfile.projects.filter((_, idx) => idx !== i);
                        updateCurrentProfile((prev) => ({ ...prev, projects: next }));
                      }}
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
                        onChange={(e) => {
                          const next = [...currentProfile.projects];
                          next[i] = { ...next[i], title: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, projects: next }));
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label>Year</label>
                      <input
                        type="text"
                        value={proj.year || ""}
                        placeholder="2026"
                        onChange={(e) => {
                          const next = [...currentProfile.projects];
                          next[i] = { ...next[i], year: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, projects: next }));
                        }}
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
                        onChange={(e) => {
                          const next = [...currentProfile.projects];
                          next[i] = { ...next[i], tech: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, projects: next }));
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label>Live URL / Repo</label>
                      <input
                        type="text"
                        value={proj.link || ""}
                        placeholder="https://..."
                        onChange={(e) => {
                          const next = [...currentProfile.projects];
                          next[i] = { ...next[i], link: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, projects: next }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Bullets / Highlights (one per line)</label>
                    <textarea
                      rows={3}
                      value={(proj.details || []).join("\n")}
                      onChange={(e) => {
                        const lines = e.target.value.split("\n");
                        const next = [...currentProfile.projects];
                        next[i] = { ...next[i], details: lines };
                        updateCurrentProfile((prev) => ({ ...prev, projects: next }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 7. Certifications */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Certifications</h3>
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() =>
                    updateCurrentProfile((prev) => ({
                      ...prev,
                      certifications: [
                        ...(prev.certifications || []),
                        { name: "Certification Name", issuer: "Issuer", year: "2024", link: "", details: "" }
                      ]
                    }))
                  }
                >
                  <FiPlus size={12} /> Add Certification
                </button>
              </div>
              {(currentProfile.certifications || []).map((cert, i) => (
                <div key={i} className="entry-card">
                  <div className="entry-card-header">
                    <span className="entry-num">Certification #{i + 1}</span>
                    <button
                      type="button"
                      className="row-del-btn"
                      onClick={() => {
                        const next = currentProfile.certifications.filter((_, idx) => idx !== i);
                        updateCurrentProfile((prev) => ({ ...prev, certifications: next }));
                      }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                  <div className="grid-2-col">
                    <div className="field-group">
                      <label>Certification Name</label>
                      <input
                        type="text"
                        value={cert.name || ""}
                        onChange={(e) => {
                          const next = [...currentProfile.certifications];
                          next[i] = { ...next[i], name: e.target.value };
                          updateCurrentProfile((prev) => ({ ...prev, certifications: next }));
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label>Issuer & Year</label>
                      <div className="grid-2-col">
                        <input
                          type="text"
                          value={cert.issuer || ""}
                          placeholder="AWS, Google..."
                          onChange={(e) => {
                            const next = [...currentProfile.certifications];
                            next[i] = { ...next[i], issuer: e.target.value };
                            updateCurrentProfile((prev) => ({ ...prev, certifications: next }));
                          }}
                        />
                        <input
                          type="text"
                          value={cert.year || ""}
                          placeholder="2024"
                          onChange={(e) => {
                            const next = [...currentProfile.certifications];
                            next[i] = { ...next[i], year: e.target.value };
                            updateCurrentProfile((prev) => ({ ...prev, certifications: next }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 8. Achievements */}
            <div className="admin-card">
              <div className="card-header-row">
                <h3 className="card-title">Achievements & Leadership</h3>
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() =>
                    updateCurrentProfile((prev) => ({
                      ...prev,
                      achievements: [
                        ...(prev.achievements || []),
                        { label: "Achievement", description: "Details..." }
                      ]
                    }))
                  }
                >
                  <FiPlus size={12} /> Add Achievement
                </button>
              </div>
              {(currentProfile.achievements || []).map((ach, i) => (
                <div key={i} className="entry-card">
                  <div className="entry-card-header">
                    <span className="entry-num">Achievement #{i + 1}</span>
                    <button
                      type="button"
                      className="row-del-btn"
                      onClick={() => {
                        const next = currentProfile.achievements.filter((_, idx) => idx !== i);
                        updateCurrentProfile((prev) => ({ ...prev, achievements: next }));
                      }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                  <div className="field-group">
                    <label>Label</label>
                    <input
                      type="text"
                      value={ach.label || ""}
                      placeholder="e.g. BPUT Tech Carnival 2025"
                      onChange={(e) => {
                        const next = [...currentProfile.achievements];
                        next[i] = { ...next[i], label: e.target.value };
                        updateCurrentProfile((prev) => ({ ...prev, achievements: next }));
                      }}
                    />
                  </div>
                  <div className="field-group">
                    <label>Description (supports HTML formatting)</label>
                    <input
                      type="text"
                      value={ach.description || ""}
                      onChange={(e) => {
                        const next = [...currentProfile.achievements];
                        next[i] = { ...next[i], description: e.target.value };
                        updateCurrentProfile((prev) => ({ ...prev, achievements: next }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            CANONICAL ATS RESUME VIEWER (Exact Resume-Abstraction Layout)
            ========================================================================= */}
        {(activeView === "split" || activeView === "resume") && (
          <div className="resume-viewer-pane custom-scrollbar">
            <div className="resume-page" id="printable-resume">
              {/* Header Section */}
              {currentProfile.header?.showPhoto ? (
                <header className="header-with-photo mb-3">
                  <div className="header-text-col">
                    <h1 className="resume-name text-left">{currentProfile.header?.name || ""}</h1>
                    <div className="header-contact-stacked">
                      {(currentProfile.header?.contact || []).map((c, idx) => (
                        <div key={idx} className="stacked-link">
                          {c.link ? (
                            <a href={c.link} target="_blank" rel="noopener noreferrer">
                              {c.text}
                            </a>
                          ) : (
                            <span>{c.text}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {currentProfile.header?.location && (
                      <div className="header-location text-left">{currentProfile.header.location}</div>
                    )}
                  </div>

                  {/* Passport Photo Box */}
                  <div className="passport-photo-wrapper">
                    <div className="passport-photo-box group">
                      {currentProfile.header?.photo ? (
                        <>
                          <img
                            src={currentProfile.header.photo}
                            alt={currentProfile.header?.name || "Passport Photo"}
                            className="passport-photo-img"
                          />
                          <div className="passport-photo-overlay no-print">
                            <button
                              type="button"
                              className="photo-overlay-btn blue"
                              onClick={() => photoInputRef.current?.click()}
                              title="Change Photo"
                            >
                              <FiCamera size={12} />
                            </button>
                            <button
                              type="button"
                              className="photo-overlay-btn red"
                              onClick={handleRemovePhoto}
                              title="Remove Photo"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div
                          className="passport-photo-placeholder no-print"
                          onClick={() => photoInputRef.current?.click()}
                          title="Upload passport photo"
                        >
                          <FiPlus size={20} className="placeholder-icon" />
                          <span className="placeholder-text">Add Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </header>
              ) : (
                <header className="text-center mb-3">
                  <h1 className="resume-name">{currentProfile.header?.name || ""}</h1>
                  <div className="header-contact-centered">
                    {(currentProfile.header?.contact || []).map((c, idx, arr) => (
                      <span key={idx} className="contact-chunk">
                        {c.link ? (
                          <a href={c.link} target="_blank" rel="noopener noreferrer">
                            {c.text}
                          </a>
                        ) : (
                          <span>{c.text}</span>
                        )}
                        {idx < arr.length - 1 && <span className="contact-pipe">|</span>}
                      </span>
                    ))}
                  </div>
                  {currentProfile.header?.location && (
                    <div className="header-location">{currentProfile.header.location}</div>
                  )}
                </header>
              )}

              {/* Summary Section */}
              {currentProfile.summary && (
                <section id="summary-section">
                  <h2>Summary</h2>
                  <p
                    className="summary-p"
                    dangerouslySetInnerHTML={{ __html: currentProfile.summary }}
                  />
                </section>
              )}

              {/* Technical Skills Section */}
              {currentProfile.skills && currentProfile.skills.length > 0 && (
                <section id="skills-section">
                  <h2>Technical Skills</h2>
                  <div className="skills-grid">
                    {currentProfile.skills.map((sk, idx) => (
                      <div key={idx} className="skill-line">
                        <span className="bold">{sk.category}:</span>
                        <span>{sk.items}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Work Experience Section */}
              {currentProfile.experience && currentProfile.experience.length > 0 && (
                <section id="experience-section">
                  <h2>Work Experience</h2>
                  {currentProfile.experience.map((exp, idx) => (
                    <div key={idx} className="experience-item mb-2">
                      <div className="item-header">
                        <span>
                          {exp.role}
                          {exp.link && (
                            <a
                              className="public-view-link no-print"
                              href={exp.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              LINK
                            </a>
                          )}
                        </span>
                        <span>{exp.period}</span>
                      </div>
                      <ul>
                        {(Array.isArray(exp.details) ? exp.details : [])
                          .filter((d) => d && d.trim())
                          .map((detail, di) => (
                            <li key={di} dangerouslySetInnerHTML={{ __html: detail }} />
                          ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {/* Top Projects Section */}
              {currentProfile.projects && currentProfile.projects.length > 0 && (
                <section id="projects-section">
                  <h2>Top Projects</h2>
                  {currentProfile.projects.map((proj, idx) => (
                    <div key={idx} className="project-item mb-2">
                      <div className="item-header">
                        <span>
                          <strong>{proj.title}</strong>
                          {proj.link && (
                            <a
                              className="public-view-link no-print"
                              href={proj.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              LINK
                            </a>
                          )}
                          {proj.tech && (
                            <span className="project-tech-sub">
                              <br />
                              <span className="font-normal italic">{proj.tech}</span>
                            </span>
                          )}
                        </span>
                        <span>{proj.year}</span>
                      </div>
                      <ul>
                        {(Array.isArray(proj.details) ? proj.details : [])
                          .filter((d) => d && d.trim())
                          .map((detail, di) => (
                            <li key={di} dangerouslySetInnerHTML={{ __html: detail }} />
                          ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {/* Education Section */}
              {currentProfile.education && currentProfile.education.length > 0 && (
                <section id="education-section">
                  <h2>Education</h2>
                  {currentProfile.education.map((edu, idx) => (
                    <div key={idx} className="education-item mb-2">
                      <div className="item-header">
                        <span>{edu.institution}</span>
                        <span>{edu.period}</span>
                      </div>
                      <div className="item-sub">
                        <span>{edu.degree}</span>
                        <span>{edu.score}</span>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Certifications Section */}
              {currentProfile.certifications && currentProfile.certifications.length > 0 && (
                <section id="certifications-section">
                  <h2>Certifications</h2>
                  <ul>
                    {currentProfile.certifications.map((cert, idx) => (
                      <li key={idx}>
                        <strong>{cert.name}</strong>
                        {cert.link && (
                          <a
                            className="public-view-link no-print"
                            href={cert.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            LINK
                          </a>
                        )}
                        {cert.issuer && ` — ${cert.issuer}`}
                        {cert.year && ` (${cert.year})`}
                        {cert.details && `: ${cert.details}`}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Achievements & Leadership Section */}
              {currentProfile.achievements && currentProfile.achievements.length > 0 && (
                <section id="achievements-section">
                  <h2>Achievements & Leadership</h2>
                  <ul>
                    {currentProfile.achievements.map((ach, idx) => (
                      <li key={idx}>
                        <strong>{ach.label}: </strong>
                        <span dangerouslySetInnerHTML={{ __html: ach.description }} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Custom Sections */}
              {(currentProfile.customSections || []).map((sec, idx) => (
                <section key={idx} className="custom-resume-section">
                  <h2>{sec.title || "Custom Section"}</h2>
                  <ul>
                    {(sec.items || []).map((it, ii) => (
                      <li key={ii}>{it}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
