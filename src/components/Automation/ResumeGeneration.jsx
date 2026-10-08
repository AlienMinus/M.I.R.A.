import { useState, useEffect, useRef } from "react";
import { FiCheck, FiZoomIn, FiZoomOut } from "react-icons/fi";
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

  // A4 Preview Dynamic Scaling State
  const [zoomMode, setZoomMode] = useState("auto"); // "auto" | "fit-width" | "custom"
  const [customScale, setCustomScale] = useState(1);
  const [computedScale, setComputedScale] = useState(0.72);
  const [docHeight, setDocHeight] = useState(1123);

  // Split View Horizontal Span (Adjustable separator)
  const [splitRatio, setSplitRatio] = useState(() => {
    try {
      const saved = localStorage.getItem("mira_resume_split_ratio");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 20 && parsed <= 80) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return 48; // default 48% editor / 52% preview
  });
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);

  const photoInputRef = useRef(null);
  const jsonImportRef = useRef(null);
  const viewerPaneRef = useRef(null);
  const innerDocRef = useRef(null);
  const workspaceRef = useRef(null);

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

  // Dynamically calculate A4 fit scale whenever viewport, container or active profile changes
  useEffect(() => {
    const paneEl = viewerPaneRef.current;
    if (!paneEl) return;

    const calculateScale = () => {
      const rect = paneEl.getBoundingClientRect();
      const availW = Math.max(rect.width - 24, 120);
      const availH = Math.max(rect.height - 46, 120);

      const renderedHeight = innerDocRef.current?.offsetHeight || 1123;
      const targetH = Math.max(1123, renderedHeight);
      setDocHeight(targetH);

      const scaleW = availW / 794;
      const scaleH = availH / targetH;
      const autoFit = Math.min(scaleW, scaleH);

      setComputedScale(Math.max(0.25, Math.min(autoFit, 1.3)));
    };

    calculateScale();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        calculateScale();
      });
      ro.observe(paneEl);
    } else {
      window.addEventListener("resize", calculateScale);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", calculateScale);
    };
  }, [activeView, currentProfile, splitRatio]);

  const fitWidthScale = viewerPaneRef.current
    ? (viewerPaneRef.current.clientWidth - 28) / 794
    : 0.8;

  const activeScale =
    zoomMode === "auto"
      ? computedScale
      : zoomMode === "fit-width"
      ? Math.max(0.3, Math.min(fitWidthScale, 1.5))
      : customScale;

  // Split View Dragging Handlers
  const startDraggingSplitter = (clientX) => {
    setIsDraggingSplitter(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (e) => {
      if (!workspaceRef.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = workspaceRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPercent = ((x - rect.left) / rect.width) * 100;
      const clamped = Math.max(20, Math.min(80, rawPercent));
      const rounded = Math.round(clamped * 10) / 10;
      setSplitRatio(rounded);
      try {
        localStorage.setItem("mira_resume_split_ratio", rounded.toString());
      } catch (err) {
        // ignore
      }
    };

    const handleEnd = () => {
      setIsDraggingSplitter(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
  };

  const handleMouseDownSplitter = (e) => {
    e.preventDefault();
    startDraggingSplitter(e.clientX);
  };

  const handleTouchStartSplitter = (e) => {
    if (e.touches && e.touches[0]) {
      startDraggingSplitter(e.touches[0].clientX);
    }
  };

  const handleResetSplitter = () => {
    setSplitRatio(48);
    try {
      localStorage.setItem("mira_resume_split_ratio", "48");
    } catch (e) {}
    showToast("Split view span reset to default (48:52)");
  };

  const handleKeyDownSplitter = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSplitRatio((prev) => {
        const nextVal = Math.max(20, Math.round((prev - 2) * 10) / 10);
        try { localStorage.setItem("mira_resume_split_ratio", nextVal.toString()); } catch (err) {}
        return nextVal;
      });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSplitRatio((prev) => {
        const nextVal = Math.min(80, Math.round((prev + 2) * 10) / 10);
        try { localStorage.setItem("mira_resume_split_ratio", nextVal.toString()); } catch (err) {}
        return nextVal;
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      handleResetSplitter();
    }
  };

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
      <div
        ref={workspaceRef}
        className={`workspace-grid view-${activeView} ${isDraggingSplitter ? "is-resizing" : ""}`}
        style={
          activeView === "split"
            ? {
                gridTemplateColumns: `${splitRatio}% 10px minmax(0, 1fr)`,
                gap: 0
              }
            : undefined
        }
      >
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

        {/* Adjustable Split View Separator */}
        {activeView === "split" && (
          <div
            className={`split-view-separator ${isDraggingSplitter ? "active" : ""}`}
            onMouseDown={handleMouseDownSplitter}
            onTouchStart={handleTouchStartSplitter}
            onDoubleClick={handleResetSplitter}
            onKeyDown={handleKeyDownSplitter}
            tabIndex={0}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={splitRatio}
            aria-valuemin={20}
            aria-valuemax={80}
            title="Drag horizontally to resize panels (Double-click to reset, Arrow keys to adjust)"
          >
            <div className="separator-handle-line" />
            <div className="separator-handle-pill" />
          </div>
        )}

        {/* ATS Resume Viewer Pane */}
        {(activeView === "split" || activeView === "resume") && (
          <div className="resume-viewer-pane custom-scrollbar" ref={viewerPaneRef}>
            {/* Dynamic Zoom & A4 Ratio Toolbar */}
            <div className="resume-zoom-toolbar no-print">
              <button
                type="button"
                className="zoom-toolbar-btn"
                onClick={() => {
                  setZoomMode("custom");
                  setCustomScale(Math.max(0.3, activeScale - 0.1));
                }}
                title="Zoom Out"
              >
                <FiZoomOut size={12} />
              </button>

              <button
                type="button"
                className={`zoom-toolbar-badge ${zoomMode === "auto" ? "active" : ""}`}
                onClick={() => setZoomMode("auto")}
                title="Auto fit A4 page to window"
              >
                {zoomMode === "auto"
                  ? `Auto Fit (${Math.round(computedScale * 100)}%)`
                  : `${Math.round(activeScale * 100)}%`}
              </button>

              <button
                type="button"
                className="zoom-toolbar-btn"
                onClick={() => {
                  setZoomMode("custom");
                  setCustomScale(Math.min(1.8, activeScale + 0.1));
                }}
                title="Zoom In"
              >
                <FiZoomIn size={12} />
              </button>

              <div className="zoom-toolbar-sep" />

              <button
                type="button"
                className={`zoom-toolbar-text-btn ${activeScale === 1 && zoomMode === "custom" ? "active" : ""}`}
                onClick={() => {
                  setZoomMode("custom");
                  setCustomScale(1.0);
                }}
                title="Actual 100% size"
              >
                100%
              </button>

              <button
                type="button"
                className={`zoom-toolbar-text-btn ${zoomMode === "fit-width" ? "active" : ""}`}
                onClick={() => setZoomMode("fit-width")}
                title="Fit to page width"
              >
                Fit Width
              </button>
            </div>

            {/* A4 Scaled Page Container */}
            <div className="resume-scale-wrapper">
              <div
                className="resume-scale-box"
                style={{
                  width: `${Math.round(794 * activeScale)}px`,
                  height: `${Math.round(docHeight * activeScale)}px`
                }}
              >
                <div
                  ref={innerDocRef}
                  className="resume-scale-inner"
                  style={{
                    transform: `scale(${activeScale})`,
                    transformOrigin: "top left"
                  }}
                >
                  <ResumeDocument
                    profile={currentProfile}
                    onTriggerPhotoUpload={() => photoInputRef.current?.click()}
                    onRemovePhoto={handleRemovePhoto}
                  />
                </div>
              </div>
            </div>
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
