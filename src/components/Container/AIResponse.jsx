import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FiCopy, FiCheck } from "react-icons/fi";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./AIResponse.css";

function CodeBlock({ node, inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang">{match[1]}</span>
        <button onClick={handleCopy} className="copy-btn">
          {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px" }}
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  ) : (
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
        <div className="ai-message-bubble">
          <div className="thinking-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-response-container">
      <div className="ai-message-bubble">
        <ReactMarkdown components={{ code: CodeBlock }}>{text}</ReactMarkdown>
      </div>
      <CopyMessageButton text={text} />
    </div>
  );
}