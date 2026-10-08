import { useState, useEffect, useRef } from "react";
import {
  FiUser,
  FiAlignLeft,
  FiCode,
  FiBriefcase,
  FiFolder,
  FiBookOpen,
  FiAward,
  FiStar,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiCheck
} from "react-icons/fi";

import HeaderEditor from "./HeaderEditor";
import SummaryEditor from "./SummaryEditor";
import SkillsEditor from "./SkillsEditor";
import ExperienceEditor from "./ExperienceEditor";
import ProjectsEditor from "./ProjectsEditor";
import EducationEditor from "./EducationEditor";
import CertificationsEditor from "./CertificationsEditor";
import AchievementsEditor from "./AchievementsEditor";
import CustomSectionsEditor from "./CustomSectionsEditor";

const SECTIONS = [
  { id: "header", label: "Header", icon: FiUser },
  { id: "summary", label: "Summary", icon: FiAlignLeft },
  { id: "skills", label: "Skills", icon: FiCode },
  { id: "experience", label: "Experience", icon: FiBriefcase },
  { id: "projects", label: "Projects", icon: FiFolder },
  { id: "education", label: "Education", icon: FiBookOpen },
  { id: "certifications", label: "Certifications", icon: FiAward },
  { id: "achievements", label: "Achievements", icon: FiStar },
  { id: "custom", label: "Custom", icon: FiLayers }
];

export default function ResumeEditor({
  profile,
  onUpdateProfile,
  onPhotoUploadClick,
  onRemovePhoto,
  onAiPolishSummary
}) {
  const [activeSection, setActiveSection] = useState("header");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const prevSection = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

  const currentSectionObj = SECTIONS[currentIndex] || SECTIONS[0];
  const CurrentIcon = currentSectionObj.icon;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getSectionCount = (id) => {
    switch (id) {
      case "skills":
        return profile.skills?.length || 0;
      case "experience":
        return profile.experience?.length || 0;
      case "projects":
        return profile.projects?.length || 0;
      case "education":
        return profile.education?.length || 0;
      case "certifications":
        return profile.certifications?.length || 0;
      case "achievements":
        return profile.achievements?.length || 0;
      case "custom":
        return profile.customSections?.length || 0;
      default:
        return null;
    }
  };

  const currentCount = getSectionCount(currentSectionObj.id);

  return (
    <div className="editor-pane no-print">
      {/* Section Dropdown Selector & Quick Stepper (Replaces horizontal scrolling bar) */}
      <div className="editor-nav-dropdown-bar">
        <div className="section-dropdown-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className={`section-dropdown-trigger ${isDropdownOpen ? "open" : ""}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            title="Switch resume section"
          >
            <div className="dropdown-trigger-left">
              <span className="dropdown-trigger-icon-wrap">
                <CurrentIcon size={14} className="dropdown-trigger-icon" />
              </span>
              <span className="dropdown-trigger-label">{currentSectionObj.label}</span>
              {currentCount !== null && currentCount > 0 && (
                <span className="dropdown-count-badge">{currentCount}</span>
              )}
            </div>

            <div className="dropdown-trigger-right">
              <span className="dropdown-step-indicator">
                {currentIndex + 1} of {SECTIONS.length}
              </span>
              <FiChevronDown
                size={14}
                className={`dropdown-chevron ${isDropdownOpen ? "rotated" : ""}`}
              />
            </div>
          </button>

          {isDropdownOpen && (
            <div className="section-dropdown-menu custom-scrollbar">
              <div className="dropdown-menu-header">
                <span>Jump to Section</span>
                <span className="dropdown-menu-count">{SECTIONS.length} sections</span>
              </div>
              <div className="dropdown-menu-list">
                {SECTIONS.map((sec, idx) => {
                  const Icon = sec.icon;
                  const isSelected = sec.id === activeSection;
                  const count = getSectionCount(sec.id);

                  return (
                    <button
                      key={sec.id}
                      type="button"
                      className={`dropdown-menu-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setActiveSection(sec.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="dropdown-item-left">
                        <span className="dropdown-item-num">{idx + 1}</span>
                        <Icon size={13} className="dropdown-item-icon" />
                        <span className="dropdown-item-name">{sec.label}</span>
                      </div>
                      <div className="dropdown-item-right">
                        {count !== null && count > 0 && (
                          <span className="dropdown-item-badge">{count}</span>
                        )}
                        {isSelected && (
                          <FiCheck size={14} className="dropdown-item-check" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Prev / Next Step Buttons */}
        <div className="editor-quick-stepper">
          <button
            type="button"
            className="quick-step-btn"
            disabled={!prevSection}
            onClick={() => prevSection && setActiveSection(prevSection.id)}
            title={prevSection ? `Previous: ${prevSection.label}` : "First section"}
          >
            <FiChevronLeft size={15} />
          </button>
          <button
            type="button"
            className="quick-step-btn"
            disabled={!nextSection}
            onClick={() => nextSection && setActiveSection(nextSection.id)}
            title={nextSection ? `Next: ${nextSection.label}` : "Last section"}
          >
            <FiChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Active Section Content */}
      <div className="editor-section-container">
        {activeSection === "header" && (
          <HeaderEditor
            header={profile.header || {}}
            onChange={(newHeader) =>
              onUpdateProfile((prev) => ({ ...prev, header: newHeader }))
            }
            onPhotoUploadClick={onPhotoUploadClick}
            onRemovePhoto={onRemovePhoto}
          />
        )}

        {activeSection === "summary" && (
          <SummaryEditor
            summary={profile.summary || ""}
            onChange={(newSummary) =>
              onUpdateProfile((prev) => ({ ...prev, summary: newSummary }))
            }
            onAiPolish={onAiPolishSummary}
          />
        )}

        {activeSection === "skills" && (
          <SkillsEditor
            skills={profile.skills || []}
            onChange={(newSkills) =>
              onUpdateProfile((prev) => ({ ...prev, skills: newSkills }))
            }
          />
        )}

        {activeSection === "experience" && (
          <ExperienceEditor
            experience={profile.experience || []}
            onChange={(newExp) =>
              onUpdateProfile((prev) => ({ ...prev, experience: newExp }))
            }
          />
        )}

        {activeSection === "projects" && (
          <ProjectsEditor
            projects={profile.projects || []}
            onChange={(newProjects) =>
              onUpdateProfile((prev) => ({ ...prev, projects: newProjects }))
            }
          />
        )}

        {activeSection === "education" && (
          <EducationEditor
            education={profile.education || []}
            onChange={(newEdu) =>
              onUpdateProfile((prev) => ({ ...prev, education: newEdu }))
            }
          />
        )}

        {activeSection === "certifications" && (
          <CertificationsEditor
            certifications={profile.certifications || []}
            onChange={(newCerts) =>
              onUpdateProfile((prev) => ({ ...prev, certifications: newCerts }))
            }
          />
        )}

        {activeSection === "achievements" && (
          <AchievementsEditor
            achievements={profile.achievements || []}
            onChange={(newAchievements) =>
              onUpdateProfile((prev) => ({ ...prev, achievements: newAchievements }))
            }
          />
        )}

        {activeSection === "custom" && (
          <CustomSectionsEditor
            customSections={profile.customSections || []}
            onChange={(newCustom) =>
              onUpdateProfile((prev) => ({ ...prev, customSections: newCustom }))
            }
          />
        )}
      </div>

      {/* Step Navigation Footer */}
      <div className="editor-nav-footer">
        {prevSection ? (
          <button
            type="button"
            className="editor-nav-step-btn prev"
            onClick={() => setActiveSection(prevSection.id)}
          >
            <FiChevronLeft size={14} />
            <span>Prev: {prevSection.label}</span>
          </button>
        ) : (
          <div />
        )}

        <div className="editor-step-indicator">
          <span>
            {currentIndex + 1} of {SECTIONS.length}
          </span>
          <div className="editor-step-dots">
            {SECTIONS.map((_, i) => (
              <span
                key={i}
                className={`step-dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => setActiveSection(SECTIONS[i].id)}
              />
            ))}
          </div>
        </div>

        {nextSection ? (
          <button
            type="button"
            className="editor-nav-step-btn next"
            onClick={() => setActiveSection(nextSection.id)}
          >
            <span>Next: {nextSection.label}</span>
            <FiChevronRight size={14} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

