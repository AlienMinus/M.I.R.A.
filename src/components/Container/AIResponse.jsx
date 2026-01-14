import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { FiCopy, FiCheck } from "react-icons/fi";
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

export default function AIResponse({ text }) {
  if (!text) {
    return (
      <div className="ai-response-container">
        <div className="ai-message-bubble" role="status" aria-live="polite">
          <div className="thinking-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-response-container">
      <div className="ai-message-bubble" role="status" aria-live="polite">
        <ReactMarkdown components={{ code: CodeBlock }}>{text}</ReactMarkdown>
      </div>
      <CopyMessageButton text={text} />
    </div>
  );
}