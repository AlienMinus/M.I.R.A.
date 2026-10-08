import { FiCamera, FiTrash2, FiPlus } from "react-icons/fi";

export default function ResumeDocument({
  profile,
  onTriggerPhotoUpload,
  onRemovePhoto
}) {
  const header = profile.header || {};
  const showPhoto = Boolean(header.showPhoto);

  return (
    <div className="resume-page" id="printable-resume">
      {/* Header Section */}
      {showPhoto ? (
        <header id="header-section" className="header-with-photo mb-3">
          <div className="header-text-col">
            <h1 className="resume-name text-left">{header.name || ""}</h1>
            <div className="header-contact-stacked">
              {(header.contact || []).map((c, idx) => (
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
            {header.location && (
              <div className="header-location text-left">{header.location}</div>
            )}
          </div>

          {/* Passport Photo Box */}
          <div className="passport-photo-wrapper">
            <div className="passport-photo-box group">
              {header.photo ? (
                <>
                  <img
                    src={header.photo}
                    alt={header.name || "Passport Photo"}
                    className="passport-photo-img"
                  />
                  <div className="passport-photo-overlay no-print">
                    <button
                      type="button"
                      className="photo-overlay-btn blue"
                      onClick={onTriggerPhotoUpload}
                      title="Change Photo"
                    >
                      <FiCamera size={12} />
                    </button>
                    <button
                      type="button"
                      className="photo-overlay-btn red"
                      onClick={onRemovePhoto}
                      title="Remove Photo"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="passport-photo-placeholder no-print"
                  onClick={onTriggerPhotoUpload}
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
        <header id="header-section" className="text-center mb-3">
          <h1 className="resume-name">{header.name || ""}</h1>
          <div className="header-contact-centered">
            {(header.contact || []).map((c, idx, arr) => (
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
          {header.location && (
            <div className="header-location">{header.location}</div>
          )}
        </header>
      )}

      {/* Summary Section */}
      {profile.summary && (
        <section id="summary-section">
          <h2>Summary</h2>
          <p
            className="summary-p"
            dangerouslySetInnerHTML={{ __html: profile.summary }}
          />
        </section>
      )}

      {/* Technical Skills Section */}
      {profile.skills && profile.skills.length > 0 && (
        <section id="skills-section">
          <h2>Technical Skills</h2>
          <div className="skills-grid">
            {profile.skills.map((sk, idx) => (
              <div key={idx} className="skill-line">
                <span className="bold">{sk.category}:</span>
                <span>{sk.items}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience Section */}
      {profile.experience && profile.experience.length > 0 && (
        <section id="experience-section">
          <h2>Work Experience</h2>
          {profile.experience.map((exp, idx) => (
            <div key={idx} className="experience-item mb-2">
              <div className="item-header">
                <span>
                  {exp.role}
                  {exp.link && (
                    <a
                      className="public-view-link"
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
      {profile.projects && profile.projects.length > 0 && (
        <section id="projects-section">
          <h2>Top Projects</h2>
          {profile.projects.map((proj, idx) => (
            <div key={idx} className="project-item mb-2">
              <div className="item-header">
                <span>
                  <strong>{proj.title}</strong>
                  {proj.link && (
                    <a
                      className="public-view-link"
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
      {profile.education && profile.education.length > 0 && (
        <section id="education-section">
          <h2>Education</h2>
          {profile.education.map((edu, idx) => (
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
      {profile.certifications && profile.certifications.length > 0 && (
        <section id="certifications-section">
          <h2>Certifications</h2>
          <ul>
            {profile.certifications.map((cert, idx) => (
              <li key={idx}>
                <strong>{cert.name}</strong>
                {cert.link && (
                  <a
                    className="public-view-link"
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
      {profile.achievements && profile.achievements.length > 0 && (
        <section id="achievements-section">
          <h2>Achievements & Leadership</h2>
          <ul>
            {profile.achievements.map((ach, idx) => (
              <li key={idx}>
                <strong>{ach.label}: </strong>
                <span dangerouslySetInnerHTML={{ __html: ach.description }} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Custom Sections */}
      <section id="custom-sections-container">
        {(profile.customSections || []).map((sec, idx) => (
          <div key={idx} className="custom-resume-section">
            <h2>{sec.title || "Custom Section"}</h2>
            <ul>
              {(sec.items || []).map((it, ii) => (
                <li key={ii}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

