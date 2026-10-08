import { useState, useEffect, useRef } from "react";
import { FiX, FiRefreshCw, FiDownload } from "react-icons/fi";
import { buildPdfBlob, downloadPdfBlob } from "./pdfGenerator";

const SECTION_OPTIONS = [
  { id: "summary-section", label: "Summary" },
  { id: "education-section", label: "Education" },
  { id: "skills-section", label: "Technical Skills" },
  { id: "experience-section", label: "Work Experience" },
  { id: "projects-section", label: "Top Projects" },
  { id: "certifications-section", label: "Certifications" },
  { id: "achievements-section", label: "Achievements & Leadership" },
  { id: "custom-sections-container", label: "Custom Sections" }
];

export default function PdfModal({ isOpen, onClose, profileName, showToast }) {
  const [pdfOptions, setPdfOptions] = useState({
    scale: 100,
    pageSize: "a4",
    marginTop: 7,
    marginRight: 10,
    marginBottom: 7,
    marginLeft: 10,
    breakMode: "auto",
    breakSections: []
  });

  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("Ready");
  const renderDebounceRef = useRef(null);

  const handleRenderPdfPreview = async (overrideOptions) => {
    const opts = overrideOptions || pdfOptions;
    setIsRenderingPdf(true);
    setPdfStatus("Rendering…");
    try {
      const sourceEl = document.getElementById("printable-resume");
      if (!sourceEl) throw new Error("Resume element not found.");
      const blob = await buildPdfBlob(sourceEl, opts);
      setPdfBlob(blob);
      setPdfUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return URL.createObjectURL(blob);
      });
      setPdfStatus("Ready");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setPdfStatus(err.message || "Unable to render PDF");
    } finally {
      setIsRenderingPdf(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setPdfBlob(null);
      return;
    }

    clearTimeout(renderDebounceRef.current);
    renderDebounceRef.current = setTimeout(() => {
      handleRenderPdfPreview();
    }, 200);

    return () => clearTimeout(renderDebounceRef.current);
  }, [isOpen, pdfOptions]);

  const handleResetPdfOptions = () => {
    setPdfOptions({
      scale: 100,
      pageSize: "a4",
      marginTop: 7,
      marginRight: 10,
      marginBottom: 7,
      marginLeft: 10,
      breakMode: "auto",
      breakSections: []
    });
  };

  const handleDownloadFinalPdf = () => {
    if (!pdfBlob) return;
    const cleanName =
      (profileName || "resume")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "") || "resume";
    downloadPdfBlob(pdfBlob, `${cleanName}.pdf`);
    if (showToast) showToast("Downloaded PDF successfully!");
  };

  const toggleBreakSection = (secId) => {
    setPdfOptions((prev) => {
      const exists = prev.breakSections.includes(secId);
      const next = exists
        ? prev.breakSections.filter((id) => id !== secId)
        : [...prev.breakSections, secId];
      return { ...prev, breakSections: next };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="pdf-modal-overlay no-print" onClick={onClose}>
      <div className="pdf-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="pdf-modal-header">
          <div>
            <h2 className="pdf-modal-title">Download PDF</h2>
            <p className="pdf-modal-subtitle">
              Adjust scale and margins while keeping the resume layout intact.
            </p>
          </div>
          <button
            type="button"
            className="pdf-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body: Left Controls + Right Preview */}
        <div className="pdf-modal-body">
          {/* Left Sidebar Controls */}
          <div className="pdf-modal-sidebar custom-scrollbar">
            {/* Scale */}
            <div className="pdf-control-group">
              <div className="pdf-control-label-row">
                <label className="pdf-control-label">Scale</label>
                <span className="pdf-scale-badge">{pdfOptions.scale}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={pdfOptions.scale}
                onChange={(e) =>
                  setPdfOptions((prev) => ({ ...prev, scale: Number(e.target.value) }))
                }
                className="pdf-range-input"
              />
              <div className="pdf-range-ticks">
                <span>50%</span>
                <span>100%</span>
                <span>150%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Page Size */}
            <div className="pdf-control-group">
              <label className="pdf-control-label">Page size</label>
              <select
                value={pdfOptions.pageSize}
                onChange={(e) =>
                  setPdfOptions((prev) => ({ ...prev, pageSize: e.target.value }))
                }
                className="pdf-select-input"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            {/* Margins */}
            <div className="pdf-control-group">
              <label className="pdf-control-label">Margins (mm)</label>
              <div className="pdf-margins-grid">
                <label className="pdf-margin-sublabel">
                  Top
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="1"
                    value={pdfOptions.marginTop}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        marginTop: Number(e.target.value)
                      }))
                    }
                    className="pdf-margin-input"
                  />
                </label>
                <label className="pdf-margin-sublabel">
                  Right
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="1"
                    value={pdfOptions.marginRight}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        marginRight: Number(e.target.value)
                      }))
                    }
                    className="pdf-margin-input"
                  />
                </label>
                <label className="pdf-margin-sublabel">
                  Bottom
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="1"
                    value={pdfOptions.marginBottom}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        marginBottom: Number(e.target.value)
                      }))
                    }
                    className="pdf-margin-input"
                  />
                </label>
                <label className="pdf-margin-sublabel">
                  Left
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="1"
                    value={pdfOptions.marginLeft}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        marginLeft: Number(e.target.value)
                      }))
                    }
                    className="pdf-margin-input"
                  />
                </label>
              </div>
            </div>

            {/* Page Breaks */}
            <div className="pdf-control-group">
              <label className="pdf-control-label">Page breaks</label>
              <select
                value={pdfOptions.breakMode}
                onChange={(e) =>
                  setPdfOptions((prev) => ({ ...prev, breakMode: e.target.value }))
                }
                className="pdf-select-input"
              >
                <option value="auto">Automatic</option>
                <option value="custom">Custom section breaks</option>
              </select>
              <p className="pdf-control-hint">
                Choose which resume sections should start on a new PDF page.
              </p>
            </div>

            {/* Custom Page Break Checkboxes */}
            {pdfOptions.breakMode === "custom" && (
              <div className="pdf-custom-breaks-card">
                <div className="pdf-custom-breaks-title">Start new page before</div>
                <div className="pdf-custom-breaks-list">
                  {SECTION_OPTIONS.map((item) => (
                    <label key={item.id} className="pdf-break-checkbox-label">
                      <input
                        type="checkbox"
                        checked={pdfOptions.breakSections.includes(item.id)}
                        onChange={() => toggleBreakSection(item.id)}
                        className="pdf-break-checkbox"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Layout Protection Info */}
            <div className="pdf-info-card">
              <div className="pdf-info-title">Layout protection</div>
              <div className="pdf-info-bullet">
                • Scale adjusts font and spacing proportionally across fixed margins.
              </div>
              <div className="pdf-info-bullet">
                • Margins are applied around the rendered resume.
              </div>
              <div className="pdf-info-bullet">
                • Links are preserved as clickable PDF links.
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              className="pdf-reset-btn"
              onClick={handleResetPdfOptions}
            >
              <FiRefreshCw size={13} /> Reset
            </button>
          </div>

          {/* Right Live Preview Column */}
          <div className="pdf-modal-preview-col">
            <div className="pdf-preview-bar">
              <span className="pdf-preview-title">PDF Preview</span>
              <span
                className={`pdf-status-tag ${
                  isRenderingPdf ? "rendering" : pdfStatus === "Ready" ? "ready" : "error"
                }`}
              >
                {isRenderingPdf ? "Rendering…" : pdfStatus}
              </span>
            </div>
            <div className="pdf-preview-frame-wrap">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="PDF preview"
                  className="pdf-preview-iframe"
                />
              ) : (
                <div className="pdf-preview-loading">
                  <div className="pdf-spinner" />
                  <span>
                    {isRenderingPdf
                      ? "Rendering PDF preview…"
                      : "Preparing preview..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pdf-modal-footer">
          <button type="button" className="pdf-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pdf-download-action-btn"
            disabled={isRenderingPdf || !pdfBlob}
            onClick={handleDownloadFinalPdf}
          >
            <FiDownload size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

