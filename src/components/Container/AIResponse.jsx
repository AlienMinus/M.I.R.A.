import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import { FiCopy, FiCheck, FiCpu, FiImage, FiZap, FiGlobe, FiEye, FiCode, FiCheckCircle } from "react-icons/fi";
import "./AIResponse.css";

const MONACO_LANG_MAP = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  py: "python",
  python: "python",
  html: "html",
  htm: "html",
  css: "css",
  json: "json",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  java: "java",
  go: "go",
  golang: "go",
  rs: "rust",
  rust: "rust",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  shell: "shell"
};

function CodeBlock({ node, inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  const rawLang = match ? match[1].toLowerCase() : "plaintext";
  const monacoLang = MONACO_LANG_MAP[rawLang] || rawLang;
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("code"); // "code" | "preview"

  const codeContent = String(children).replace(/\n$/, "");
  const isHtml = monacoLang === "html" || codeContent.includes("<!DOCTYPE") || (codeContent.includes("<html") && codeContent.includes("</html>"));

  // Calculate dynamic editor height based on line count
  const lineCount = codeContent.split("\n").length;
  const editorHeight = Math.min(Math.max(lineCount * 21 + 24, 110), 480);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="code-block-wrapper">
        <div className="code-block-header">
          <div className="code-header-left">
            <span className="code-lang">{rawLang}</span>
            {/* PREVIEW BUTTON FOR HTML ONLY */}
            {isHtml && (
              <div className="code-tabs">
                <button
                  type="button"
                  className={`code-tab-btn ${viewMode === "code" ? "active" : ""}`}
                  onClick={() => setViewMode("code")}
                >
                  <FiCode size={13} /> Code
                </button>
                <button
                  type="button"
                  className={`code-tab-btn ${viewMode === "preview" ? "active" : ""}`}
                  onClick={() => setViewMode("preview")}
                >
                  <FiEye size={13} /> Preview
                </button>
              </div>
            )}
          </div>

          <button onClick={handleCopy} className="copy-btn" aria-label="Copy code">
            {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>

        {isHtml && viewMode === "preview" ? (
          <div className="code-preview-container">
            <iframe
              title="HTML Sandbox Preview"
              srcDoc={codeContent}
              className="code-preview-frame"
              sandbox="allow-scripts"
            />
          </div>
        ) : (
          <div className="monaco-editor-shell">
            <Editor
              height={`${editorHeight}px`}
              language={monacoLang}
              theme="vs-dark"
              value={codeContent}
              loading={<pre className="code-fallback">{codeContent}</pre>}
              options={{
                readOnly: true,
                domReadOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                fontFamily: "Consolas, 'Courier New', monospace",
                lineNumbers: "on",
                renderLineHighlight: "none",
                automaticLayout: true,
                folding: true,
                overviewRulerLanes: 0,
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

function CopyMessageButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-msg-btn" onClick={handleCopy} aria-label="Copy message">
      {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
    </button>
  );
}

function MicrochipLoader() {
  const phases = [
    "Scanning neural knowledge base...",
    "Querying live web index...",
    "Scraping & verifying references...",
    "Extracting verified topic visuals...",
    "Bi-LSTM scoring & synthesis...",
    "Synthesizing neural response..."
  ];
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIdx((prev) => (prev < phases.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ai-response-container">
      <div className="microchip-loader-box" role="status" aria-live="polite">
        <FiCpu className="microchip-icon-simple" size={17} />
        <span className="microchip-single-label">{phases[phaseIdx]}</span>
      </div>
    </div>
  );
}

export default function AIResponse({ text, attachments, images = [], summary = "", sources = [] }) {
  const [activeImage, setActiveImage] = useState(null);

  if (!text) {
    if (attachments && attachments.length > 0) {
      return (
        <div className="ai-response-container">
          <div className="ai-message-bubble analyzing" role="status" aria-live="polite">
            <div className="analyzing-content">
              <FiCpu className="analyzing-icon" />
              <span>Analyzing... {attachments.length} file{attachments.length !== 1 ? 's' : ''}...</span>
            </div>
          </div>
        </div>
      );
    }

    return <MicrochipLoader />;
  }

  return (
    <div className="ai-response-container">
      <div className="ai-message-bubble" role="status" aria-live="polite">
        {/* 1. Topic Visuals Strip (on top of response text) */}
        {images && images.length > 0 && (
          <div className="topic-visuals-container">
            <div className="topic-visuals-header">
              <span className="topic-visuals-title">
                <FiImage className="header-icon" size={15} /> Verified Topic Visuals
              </span>
              <span className="topic-visuals-badge">{images.length} photos</span>
            </div>
            <div className="topic-visuals-strip">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="topic-visual-item"
                  onClick={() => setActiveImage(img)}
                  title={img.title || "Topic Image"}
                >
                  <img
                    src={img.url}
                    alt={img.title || "Visual reference"}
                    className="topic-visual-img"
                    onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                  />
                  <div className="topic-visual-caption">
                    {img.title || img.source || "Image"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Markdown AI Response */}
        <ReactMarkdown components={{ code: CodeBlock }}>{text}</ReactMarkdown>

        {/* 3. Conclusion & Summary Card (at the end as true synthesis) */}
        {summary && summary.trim() && (
          <div className="conclusion-highlight-card">
            <div className="conclusion-header">
              <FiCheckCircle className="header-icon" size={14} /> Key Conclusion & Summary
            </div>
            <div className="conclusion-body">{summary}</div>
          </div>
        )}

        {/* 4. Verified Sources Section */}
        {sources && sources.length > 0 && (
          <div className="verified-sources-container">
            <div className="verified-sources-header">
              <span className="sources-title">
                <FiGlobe className="header-icon" size={14} /> Verified Sources & References
              </span>
            </div>
            <div className="verified-sources-chips">
              {sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-chip"
                  title={src.snippet || src.title}
                >
                  <span>{src.title || `Source ${idx + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <CopyMessageButton text={text} />

      {/* Lightbox Modal */}
      {activeImage && (
        <div className="image-lightbox-overlay" onClick={() => setActiveImage(null)}>
          <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={activeImage.url} alt={activeImage.title || "Enlarged Image"} />
            {activeImage.title && (
              <div className="image-lightbox-caption">{activeImage.title}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}