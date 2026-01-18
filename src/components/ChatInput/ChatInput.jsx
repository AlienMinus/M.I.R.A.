import { useEffect, useRef, useState } from "react";
import {
  FiPlus,
  FiMic,
  FiImage,
  FiUpload,
  FiSearch,
  FiCpu,
  FiSend,
  FiSquare,
  FiChevronRight,
  FiLayers,
  FiX,
  FiGithub,
  FiSlack,
  FiHardDrive,
  FiBook,
  FiCheck,
  FiLoader
} from "react-icons/fi";
import { HiGlobeAlt } from "react-icons/hi2";
import { BsThreeDots } from "react-icons/bs";
import "./ChatInput.css";
import Attachment from "./Attachment";
import AttachmentPreview from "./AttachmentPreview";

export default function ChatInput({ onSendMessage, isLoading, onStop }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const originalInputRef = useRef("");
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [showConnectApps, setShowConnectApps] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const prevLoading = useRef(isLoading);

  useEffect(() => {
    if (prevLoading.current && !isLoading) {
      setIsSearching(false);
    }
    prevLoading.current = isLoading;
  }, [isLoading]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setIsSpeechSupported(true);
    }
    
    // Check if mobile
    if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setIsMobile(true);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startVisualizer = async () => {
    // On mobile devices, accessing getUserMedia while SpeechRecognition is active
    // causes a conflict ("Chrome is recording") and stops recognition.
    if (isMobile) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      
      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#a855f7";
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "#ef4444");
        gradient.addColorStop(0.5, "#a855f7");
        gradient.addColorStop(1, "#3b82f6");
        ctx.strokeStyle = gradient;
        
        ctx.beginPath();
        
        // Zero-crossing detection to stabilize the wave
        let zeroCross = -1;
        for (let i = 0; i < bufferLength / 2; i++) {
          if (dataArray[i] < 128 && dataArray[i + 1] >= 128) {
            zeroCross = i;
            break;
          }
        }
        
        const startIndex = zeroCross === -1 ? 0 : zeroCross;
        const drawLength = Math.floor(bufferLength / 3);
        const sliceWidth = width * 1.0 / drawLength;
        let x = 0;
        
        for(let i = 0; i < drawLength; i++) {
          const index = startIndex + i;
          const val = index < bufferLength ? dataArray[index] : 128;
          const v = val / 128.0;
          const y = v * height / 2;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          x += sliceWidth;
        }
        
        ctx.stroke();
      };
      draw();
    } catch (err) {
      console.error("Visualizer init error:", err);
    }
  };

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopVisualizer();
    };
  }, []);

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      stopVisualizer();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    originalInputRef.current = input;

    recognition.onstart = () => {
      setIsRecording(true);
      // Blur to prevent mobile keyboard interference which causes text duplication
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
      startVisualizer();
    };

    recognition.onresult = (event) => {
      // Safety check: ignore results from previous instances
      if (recognition !== recognitionRef.current) return;

      // 1. Deduplicate intra-session results (Android bug where results accumulate)
      const results = [];
      for (let i = 0; i < event.results.length; i++) {
        results.push(event.results[i][0].transcript);
      }

      const uniqueResults = results.filter((text, index) => {
        if (index + 1 < results.length) {
          const nextText = results[index + 1];
          // Check if current text is a prefix of the next text
          if (nextText.toLowerCase().startsWith(text.toLowerCase().trim())) {
            return false;
          }
        }
        return true;
      });

      let transcript = "";
      for (let i = 0; i < uniqueResults.length; i++) {
        const item = uniqueResults[i];
        // Add space between segments if missing
        if (transcript && !transcript.endsWith(" ") && !item.startsWith(" ")) {
          transcript += " ";
        }
        transcript += item;
      }
      
      const prefix = originalInputRef.current;
      
      // 2. Deduplicate prefix (Android bug where engine reads context)
      const normalizedTranscript = transcript.toLowerCase().trim();
      const normalizedPrefix = prefix.toLowerCase().trim();
      
      if (normalizedPrefix && normalizedTranscript.startsWith(normalizedPrefix)) {
        setInput(transcript);
      } else {
        const spacer = prefix && !prefix.endsWith(" ") && transcript && !transcript.startsWith(" ") ? " " : "";
        setInput(prefix + spacer + transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      stopVisualizer();
    };

    recognition.onend = () => {
      setIsRecording(false);
      stopVisualizer();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isRecording) {
      recognitionRef.current?.stop();
      stopVisualizer();
      setIsRecording(false);
    }

    if (!input.trim() && files.length === 0 && !isLoading) return;

    if (isLoading) {
      onStop && onStop();
      return;
    }

    // Send message to parent
    if (onSendMessage) {
      onSendMessage(input, files.map(f => f.file), webSearchEnabled);
    }

    if (webSearchEnabled) {
      setIsSearching(true);
    }

    setInput("");
    setFiles([]);
    setWebSearchEnabled(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleFilesSelected = (selectedFiles) => {
    const newFiles = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      loading: true
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setOpen(false);

    // Simulate processing time
    setTimeout(() => {
      setFiles(prev => prev.map(f => newFiles.find(nf => nf.id === f.id) ? { ...f, loading: false } : f));
    }, 1500);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles);
    }
  };

  return (
    <div 
      className={`chat-input-wrapper ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-content">
            <FiUpload className="drag-icon" />
            <p>Drop files here</p>
          </div>
        </div>
      )}

      {open && (
        <div ref={dropdownRef} className="dropdown">
          <Attachment onFilesSelected={handleFilesSelected}>
            <DropdownItem icon={<FiUpload />} text="Add photos & files" />
          </Attachment>
          <DropdownItem icon={<FiImage />} text="Create image" />
          <DropdownItem icon={<FiSearch />} text="Deep research" />
          <DropdownItem icon={<FiCpu />} text="Thinking" />
          <DropdownItem 
            icon={<BsThreeDots />} 
            text="More" 
            subItems={[
              { 
                icon: <HiGlobeAlt />, 
                text: webSearchEnabled ? "Disable Web Search" : "Enable Web Search",
                onClick: () => { setWebSearchEnabled(!webSearchEnabled); setOpen(false); }
              },
              { 
                icon: <FiLayers />, 
                text: "Connect Apps", 
                onClick: () => { setOpen(false); setShowConnectApps(true); }
              }
            ]}
          />
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        <AttachmentPreview files={files} onRemove={removeFile} />

        {(webSearchEnabled || isSearching) && (
          <div className="search-active-indicator">
            {isSearching ? (
              <FiLoader className="search-spinner" />
            ) : (
              <HiGlobeAlt />
            )}
            <span>{isSearching ? "Searching web..." : "Web Search Enabled"}</span>
            {!isSearching && (
              <button type="button" onClick={() => setWebSearchEnabled(false)} aria-label="Disable web search">
                <FiX />
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className="icon-btn"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle options"
        >
          <FiPlus style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Speak Something..." : "Ask anything"}
          rows={1}
        />
        
        {isRecording && (
          !isMobile ? (
            <canvas 
              ref={canvasRef} 
              className="audio-visualizer" 
              width={100} 
              height={30} 
            />
          ) : (
            <div className="mobile-visualizer">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )
        )}

        {(input.trim() || files.length > 0 || isLoading || isRecording || isSpeechSupported) && (
          <button
            type={(input.trim() || files.length > 0 || isLoading) && !isRecording ? "submit" : "button"}
            className={`icon-btn ${isRecording ? "recording" : ""}`}
            onClick={(e) => {
              if (isRecording) {
                handleVoiceInput();
              } else if (!input.trim() && files.length === 0 && !isLoading) {
                handleVoiceInput();
              }
            }}
            aria-label={isLoading ? "Stop generating" : isRecording ? "Stop recording" : (input.trim() || files.length > 0) ? "Send" : "Voice input"}
            data-tooltip={isLoading ? "Stop generating" : isRecording ? "Recording..." : (input.trim() || files.length > 0) ? "Send" : "Voice Input"}
          >
            {isLoading ? (
              <FiSquare fill="currentColor" size={14} />
            ) : isRecording ? (
              <FiSquare fill="#44efc1" style={{ color: "#44efc1" }} size={14} />
            ) : (input.trim() || files.length > 0) ? (
              <FiSend />
            ) : (
              <FiMic />
            )}
          </button>
        )}
      </form>

      {showConnectApps && <ConnectAppsModal onClose={() => setShowConnectApps(false)} />}
    </div>
  );
}

function DropdownItem({ icon, text, subItems }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="dropdown-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "relative", justifyContent: subItems ? "space-between" : "flex-start" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span className="dropdown-icon">{icon}</span>
        <span>{text}</span>
      </div>
      {subItems && (
        <>
          <FiChevronRight size={16} style={{ color: "#9ca3af" }} />
          {isHovered && (
            <div className="nested-dropdown">
              {subItems.map((item, index) => (
                <div 
                  key={index} 
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick && item.onClick();
                  }}
                >
                  <span className="dropdown-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConnectAppsModal({ onClose }) {
  const [apps, setApps] = useState([
    { id: "gdrive", name: "Google Drive", icon: <FiHardDrive />, connected: true },
    { id: "notion", name: "Notion", icon: <FiBook />, connected: false },
    { id: "github", name: "GitHub", icon: <FiGithub />, connected: false },
    { id: "slack", name: "Slack", icon: <FiSlack />, connected: false },
  ]);

  const toggleApp = (id) => {
    setApps(apps.map(app => 
      app.id === id ? { ...app, connected: !app.connected } : app
    ));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Connect Apps</h2>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          <div className="apps-list">
            {apps.map((app) => (
              <div key={app.id} className="app-item">
                <div className="app-info">
                  <span className="app-icon">{app.icon}</span>
                  <span>{app.name}</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={app.connected} 
                    onChange={() => toggleApp(app.id)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
