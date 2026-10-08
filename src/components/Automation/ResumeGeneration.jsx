import { useState } from "react";
import {
  FiUser,
  FiBriefcase,
  FiAward,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiPlus,
  FiTrash2,
  FiPrinter,
  FiCopy,
  FiDownload,
  FiCheck,
  FiZap,
  FiFileText,
  FiEye,
  FiEdit3
} from "react-icons/fi";
import "./Automation.css";

const DEMO_RESUME = {
  name: "Alex Vance",
  title: "Senior Full Stack Engineer & System Architect",
  email: "alex.vance@example.com",
  phone: "+1 (555) 234-5678",
  location: "San Francisco, CA",
  website: "https://alexvance.dev",
  summary: "Accomplished software engineer with 7+ years of experience engineering high-throughput distributed systems, scalable web applications, and local neural AI search engines. Proven record of optimizing microservice latencies and leading engineering squads.",
  skills: ["React 19", "TypeScript", "Python", "PyTorch", "Node.js", "Docker", "PostgreSQL", "System Architecture", "REST APIs", "Tailwind CSS"],
  experience: [
    {
      role: "Lead Full Stack Engineer",
      company: "Apex Neural Labs",
      dates: "2023 - Present",
      bullets: "Architected real-time streaming AI pipeline handling 4M+ daily tokens with sub-50ms inference latency.\nDirected a cross-functional squad of 6 frontend and backend engineers delivering enterprise AI features.\nImplemented localized vector caching algorithms cutting cloud inference costs by 34%."
    },
    {
      role: "Senior Software Engineer",
      company: "Stratosphere Cloud Inc.",
      dates: "2020 - 2023",
      bullets: "Engineered scalable microservices in Python and Node.js serving 250,000+ monthly active enterprise users.\nLed migration of legacy monolithic client to Vite + React, improving initial page load LCP by 68%.\nDesigned automated CI/CD deployment pipelines cutting staging deployment cycle from 40 mins to 6 mins."
    }
  ],
  education: [
    {
      degree: "B.S. in Computer Science",
      institution: "University of California, Berkeley",
      dates: "2016 - 2020"
    }
  ]
};

export default function ResumeGeneration() {
  const [resume, setResume] = useState(() => {
    const saved = localStorage.getItem("mira-resumanager-data");
    return saved ? JSON.parse(saved) : DEMO_RESUME;
  });

  const [activeView, setActiveView] = useState("split"); // "split" | "edit" | "preview"
  const [skillInput, setSkillInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [enhanced, setEnhanced] = useState(false);

  // Auto-save to localStorage
  const updateResume = (updater) => {
    setResume((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("mira-resumanager-data", JSON.stringify(next));
      return next;
    });
  };

  const handleAddExperience = () => {
    updateResume((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { role: "Software Engineer", company: "Company Name", dates: "2022 - Present", bullets: "Describe your responsibilities and achievements..." }
      ]
    }));
  };

  const handleRemoveExperience = (idx) => {
    updateResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateExperience = (idx, field, val) => {
    updateResume((prev) => {
      const exp = [...prev.experience];
      exp[idx] = { ...exp[idx], [field]: val };
      return { ...prev, experience: exp };
    });
  };

  const handleAddEducation = () => {
    updateResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: "Degree / Certification", institution: "Institution / University", dates: "Year" }
      ]
    }));
  };

  const handleRemoveEducation = (idx) => {
    updateResume((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateEducation = (idx, field, val) => {
    updateResume((prev) => {
      const edu = [...prev.education];
      edu[idx] = { ...edu[idx], [field]: val };
      return { ...prev, education: edu };
    });
  };

  const handleAddSkill = (e) => {
    if ((e.key === "Enter" || e.type === "click") && skillInput.trim()) {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (!resume.skills.includes(trimmed)) {
        updateResume((prev) => ({
          ...prev,
          skills: [...prev.skills, trimmed]
        }));
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill) => {
    updateResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }));
  };

  const handleAIEnhanceSummary = () => {
    setEnhanced(true);
    const polished = resume.summary
      ? `${resume.summary.trim()} Demonstrates deep technical competence with cross-functional leadership, rapid problem resolution, and continuous technical delivery.`
      : "Results-driven engineering professional with deep expertise across modern distributed technologies, algorithmic optimization, and client-centric product architectures.";
    updateResume((prev) => ({ ...prev, summary: polished }));
    setTimeout(() => setEnhanced(false), 2000);
  };

  const handleCopyMarkdown = () => {
    let md = `# ${resume.name}\n**${resume.title}**\n\n`;
    md += `${resume.email} | ${resume.phone} | ${resume.location} | ${resume.website}\n\n`;
    md += `## Professional Summary\n${resume.summary}\n\n`;
    md += `## Skills\n${resume.skills.join(", ")}\n\n`;
    md += `## Work Experience\n`;
    resume.experience.forEach((e) => {
      md += `### ${e.role} — ${e.company} (${e.dates})\n`;
      e.bullets.split("\n").forEach((b) => {
        if (b.trim()) md += `- ${b.trim()}\n`;
      });
      md += "\n";
    });
    md += `## Education\n`;
    resume.education.forEach((ed) => {
      md += `- **${ed.degree}**, ${ed.institution} (${ed.dates})\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="resumanager-container">
      {/* Top Action Bar */}
      <div className="resumanager-toolbar">
        <div className="toolbar-left">
          <div className="view-mode-tabs">
            <button
              type="button"
              className={`view-tab ${activeView === "split" ? "active" : ""}`}
              onClick={() => setActiveView("split")}
            >
              <FiFileText size={14} /> Split View
            </button>
            <button
              type="button"
              className={`view-tab ${activeView === "edit" ? "active" : ""}`}
              onClick={() => setActiveView("edit")}
            >
              <FiEdit3 size={14} /> Form Editor
            </button>
            <button
              type="button"
              className={`view-tab ${activeView === "preview" ? "active" : ""}`}
              onClick={() => setActiveView("preview")}
            >
              <FiEye size={14} /> ATS Document
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="tool-btn secondary"
            onClick={() => updateResume(DEMO_RESUME)}
            title="Load sample developer profile"
          >
            Load Sample
          </button>
          <button
            type="button"
            className="tool-btn secondary"
            onClick={handleCopyMarkdown}
            title="Copy as Markdown"
          >
            {copied ? <FiCheck size={14} /> : <FiCopy size={14} />} {copied ? "Copied!" : "Copy MD"}
          </button>
          <button
            type="button"
            className="tool-btn primary"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <FiPrinter size={14} /> Print / Export PDF
          </button>
        </div>
      </div>

      <div className={`resumanager-grid view-${activeView}`}>
        {/* LEFT COLUMN: FORM EDITOR */}
        {(activeView === "split" || activeView === "edit") && (
          <div className="resume-editor-pane custom-scrollbar">
            {/* 1. Personal Info */}
            <div className="form-section-card">
              <div className="section-title">
                <FiUser className="sec-icon" /> Personal Details
              </div>
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={resume.name}
                    onChange={(e) => updateResume({ ...resume, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-field">
                  <label>Job Title</label>
                  <input
                    type="text"
                    value={resume.title}
                    onChange={(e) => updateResume({ ...resume, title: e.target.value })}
                    placeholder="e.g. Full Stack Engineer"
                  />
                </div>
                <div className="form-field">
                  <label><FiMail size={12} /> Email</label>
                  <input
                    type="email"
                    value={resume.email}
                    onChange={(e) => updateResume({ ...resume, email: e.target.value })}
                    placeholder="name@email.com"
                  />
                </div>
                <div className="form-field">
                  <label><FiPhone size={12} /> Phone</label>
                  <input
                    type="text"
                    value={resume.phone}
                    onChange={(e) => updateResume({ ...resume, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="form-field">
                  <label><FiMapPin size={12} /> Location</label>
                  <input
                    type="text"
                    value={resume.location}
                    onChange={(e) => updateResume({ ...resume, location: e.target.value })}
                    placeholder="City, State / Country"
                  />
                </div>
                <div className="form-field">
                  <label><FiGlobe size={12} /> Portfolio / LinkedIn</label>
                  <input
                    type="text"
                    value={resume.website}
                    onChange={(e) => updateResume({ ...resume, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="form-section-card">
              <div className="section-title-row">
                <div className="section-title">
                  <FiFileText className="sec-icon" /> Professional Summary
                </div>
                <button
                  type="button"
                  className="ai-enhance-btn"
                  onClick={handleAIEnhanceSummary}
                >
                  <FiZap size={13} /> {enhanced ? "Enhanced!" : "AI Polish"}
                </button>
              </div>
              <textarea
                rows={4}
                value={resume.summary}
                onChange={(e) => updateResume({ ...resume, summary: e.target.value })}
                placeholder="Briefly describe your core expertise, career highlights, and value proposition..."
              />
            </div>

            {/* 3. Skills */}
            <div className="form-section-card">
              <div className="section-title">
                <FiAward className="sec-icon" /> Core Skills & Technologies
              </div>
              <div className="skill-input-row">
                <input
                  type="text"
                  placeholder="Type a skill and press Enter (e.g. React, Python, AWS)..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
                <button type="button" onClick={handleAddSkill} className="add-btn">
                  <FiPlus size={16} /> Add
                </button>
              </div>
              <div className="skill-tags-cloud">
                {resume.skills.map((s, idx) => (
                  <span key={idx} className="skill-tag">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s)} aria-label="Remove skill">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Experience */}
            <div className="form-section-card">
              <div className="section-title-row">
                <div className="section-title">
                  <FiBriefcase className="sec-icon" /> Work Experience
                </div>
                <button type="button" onClick={handleAddExperience} className="add-item-btn">
                  <FiPlus size={14} /> Add Role
                </button>
              </div>

              {resume.experience.map((exp, idx) => (
                <div key={idx} className="nested-item-card">
                  <div className="item-header">
                    <span className="item-num">Role #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(idx)}
                      className="delete-item-btn"
                      aria-label="Delete experience"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label>Job Title</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => handleUpdateExperience(idx, "role", e.target.value)}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div className="form-field">
                      <label>Company / Organization</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(idx, "company", e.target.value)}
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Period / Dates</label>
                    <input
                      type="text"
                      value={exp.dates}
                      onChange={(e) => handleUpdateExperience(idx, "dates", e.target.value)}
                      placeholder="e.g. 2021 - Present"
                    />
                  </div>
                  <div className="form-field">
                    <label>Achievements & Bullet Points (one per line)</label>
                    <textarea
                      rows={3}
                      value={exp.bullets}
                      onChange={(e) => handleUpdateExperience(idx, "bullets", e.target.value)}
                      placeholder="• Built high throughput backend systems&#10;• Increased throughput by 40%"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Education */}
            <div className="form-section-card">
              <div className="section-title-row">
                <div className="section-title">
                  <FiAward className="sec-icon" /> Education & Degrees
                </div>
                <button type="button" onClick={handleAddEducation} className="add-item-btn">
                  <FiPlus size={14} /> Add Education
                </button>
              </div>

              {resume.education.map((edu, idx) => (
                <div key={idx} className="nested-item-card">
                  <div className="item-header">
                    <span className="item-num">Degree #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(idx)}
                      className="delete-item-btn"
                      aria-label="Delete education"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label>Degree / Major</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(idx, "degree", e.target.value)}
                        placeholder="e.g. B.S. Computer Science"
                      />
                    </div>
                    <div className="form-field">
                      <label>Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleUpdateEducation(idx, "institution", e.target.value)}
                        placeholder="e.g. Stanford University"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Graduation Year / Dates</label>
                    <input
                      type="text"
                      value={edu.dates}
                      onChange={(e) => handleUpdateEducation(idx, "dates", e.target.value)}
                      placeholder="e.g. 2018 - 2022"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: ATS LIVE PREVIEW DOCUMENT */}
        {(activeView === "split" || activeView === "preview") && (
          <div className="resume-preview-pane custom-scrollbar">
            <div className="ats-document-sheet" id="printable-resume">
              {/* Header */}
              <div className="ats-header">
                <h1 className="ats-name">{resume.name || "Your Name"}</h1>
                <div className="ats-job-title">{resume.title || "Professional Title"}</div>
                <div className="ats-contact-bar">
                  {resume.email && <span>{resume.email}</span>}
                  {resume.phone && <span>• {resume.phone}</span>}
                  {resume.location && <span>• {resume.location}</span>}
                  {resume.website && <span>• {resume.website}</span>}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <div className="ats-section">
                  <h2 className="ats-sec-heading">PROFESSIONAL SUMMARY</h2>
                  <p className="ats-summary-text">{resume.summary}</p>
                </div>
              )}

              {/* Skills */}
              {resume.skills && resume.skills.length > 0 && (
                <div className="ats-section">
                  <h2 className="ats-sec-heading">SKILLS & CORE COMPETENCIES</h2>
                  <div className="ats-skills-list">
                    {resume.skills.map((s, i) => (
                      <span key={i} className="ats-skill-pill">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {resume.experience && resume.experience.length > 0 && (
                <div className="ats-section">
                  <h2 className="ats-sec-heading">PROFESSIONAL EXPERIENCE</h2>
                  {resume.experience.map((exp, i) => (
                    <div key={i} className="ats-exp-entry">
                      <div className="ats-exp-header">
                        <span className="ats-exp-role">{exp.role}</span>
                        <span className="ats-exp-dates">{exp.dates}</span>
                      </div>
                      <div className="ats-exp-company">{exp.company}</div>
                      <ul className="ats-bullet-list">
                        {exp.bullets
                          .split("\n")
                          .filter((b) => b.trim())
                          .map((bullet, bi) => (
                            <li key={bi}>{bullet.replace(/^[•\-\*]\s*/, "")}</li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {resume.education && resume.education.length > 0 && (
                <div className="ats-section">
                  <h2 className="ats-sec-heading">EDUCATION</h2>
                  {resume.education.map((edu, i) => (
                    <div key={i} className="ats-edu-entry">
                      <div className="ats-exp-header">
                        <span className="ats-edu-degree">{edu.degree}</span>
                        <span className="ats-exp-dates">{edu.dates}</span>
                      </div>
                      <div className="ats-edu-institution">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
