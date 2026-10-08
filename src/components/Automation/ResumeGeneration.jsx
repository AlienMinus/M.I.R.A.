import { useState, useEffect, useRef } from "react";
import { FiCheck } from "react-icons/fi";
import { DEFAULT_PROFILES } from "./defaultProfiles";
import Toolbar from "./Toolbar";
import ProfilesStrip from "./ProfilesStrip";
import ResumeDocument from "./ResumeDocument";
import ResumeEditor from "./ResumeEditor/ResumeEditor";
import PdfModal from "./PdfModal";
import "./Automation.css";

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
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const photoInputRef = useRef(null);
  const jsonImportRef = useRef(null);

  // Current active profile
  const currentProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

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
        {
          institution: "University Name",
          period: "2020 — 2024",
          degree: "Bachelor of Science",
          score: "GPA: 3.8 / 4.0"
        }
      ],
      skills: [{ category: "Core Skills", items: "Skill 1, Skill 2, Skill 3" }],
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
    cloned.header.name = `${cloned.header?.name || "Profile"} (Copy)`;

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
    e.target.value = "";
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
    const cleanName = (currentProfile.header?.name || "resume")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const blob = new Blob([JSON.stringify(currentProfile, null, 2)], {
      type: "application/json"
    });
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
      <Toolbar
        activeView={activeView}
        setActiveView={setActiveView}
        showPhoto={currentProfile.header?.showPhoto}
        onTogglePhoto={handleTogglePhoto}
        onImportClick={() => jsonImportRef.current?.click()}
        onExportJson={handleDownloadJSON}
        onDuplicateProfile={handleDuplicateProfile}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
      />

      {/* Profiles Bar */}
      <ProfilesStrip
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={setActiveProfileId}
        onNewProfile={handleNewProfile}
        onDeleteProfile={handleDeleteProfile}
        deleteConfirmId={deleteConfirmId}
        setDeleteConfirmId={setDeleteConfirmId}
      />

      {/* Main Workspace Layout */}
      <div className={`workspace-grid view-${activeView}`}>
        {/* Button-wise Section Navigation Editor */}
        {(activeView === "split" || activeView === "admin") && (
          <ResumeEditor
            profile={currentProfile}
            onUpdateProfile={updateCurrentProfile}
            onPhotoUploadClick={() => photoInputRef.current?.click()}
            onRemovePhoto={handleRemovePhoto}
            onAiPolishSummary={handleAIEnhanceSummary}
          />
        )}

        {/* ATS Resume Viewer Pane */}
        {(activeView === "split" || activeView === "resume") && (
          <div className="resume-viewer-pane custom-scrollbar">
            <ResumeDocument
              profile={currentProfile}
              onTriggerPhotoUpload={() => photoInputRef.current?.click()}
              onRemovePhoto={handleRemovePhoto}
            />
          </div>
        )}
      </div>

      {/* Self-made PDF Download & Live Preview Modal */}
      <PdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        profileName={currentProfile.header?.name}
        showToast={showToast}
      />
    </div>
  );
}
