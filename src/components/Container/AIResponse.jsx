import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { FiCopy, FiCheck, FiCpu, FiImage, FiZap, FiGlobe } from "react-icons/fi";
import "./AIResponse.css";

function CodeBlock({ node, inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);
  const [Highlighter, setHighlighter] = useState(null);
  const [style, setStyle] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (match && !Highlighter) {
      // Dynamically import the syntax highlighter and style to reduce bundle size
      (async () => {
        try {
          const [{ Prism }, styleModule] = await Promise.all([
            import("react-syntax-highlighter/dist/esm/prism"),
            import("react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus")
          ]);
          if (!mounted) return;
          setHighlighter(() => Prism);
          setStyle(styleModule.vscDarkPlus || styleModule.default || styleModule);
        } catch (e) {
          // import failed — we'll show a simple <pre> fallback
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [match, Highlighter]);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="code-block-wrapper">
        <div className="code-block-header">
          <span className="code-lang">{match[1]}</span>
          <button onClick={handleCopy} className="copy-btn" aria-label="Copy code">
            {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>
        {Highlighter ? (
          <Highlighter
            style={style}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: "0 0 8px 8px" }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </Highlighter>
        ) : (
          <pre className={`code-fallback language-${match[1]}`}>
            {String(children).replace(/\n$/, "")}
          </pre>
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

        {/* 2. Executive Summary Highlight Card */}
        {summary && summary.trim() && (
          <div className="summary-highlight-card">
            <div className="summary-header">
              <FiZap className="header-icon" size={14} /> Executive Summary
            </div>
            <div className="summary-body">{summary}</div>
          </div>
        )}

        {/* 3. Markdown AI Response */}
        <ReactMarkdown components={{ code: CodeBlock }}>{text}</ReactMarkdown>

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