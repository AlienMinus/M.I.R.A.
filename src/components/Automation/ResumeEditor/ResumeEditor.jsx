import { useState } from "react";
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
  FiChevronRight
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

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const prevSection = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

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

  return (
    <div className="editor-pane no-print">
      {/* Button-wise Section Navigation Tabs */}
      <div className="editor-nav-bar custom-scrollbar">
        {SECTIONS.map((sec, idx) => {
          const Icon = sec.icon;
          const isActive = sec.id === activeSection;
          const count = getSectionCount(sec.id);

          return (
            <button
              key={sec.id}
              type="button"
              className={`editor-nav-btn ${isActive ? "active" : ""}`}
              onClick={() => setActiveSection(sec.id)}
              title={`Switch to ${sec.label}`}
            >
              <Icon size={13} className="nav-btn-icon" />
              <span className="nav-btn-label">{sec.label}</span>
              {count !== null && count > 0 && (
                <span className="nav-btn-badge">{count}</span>
              )}
            </button>
          );
        })}
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

