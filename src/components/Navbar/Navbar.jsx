import { useState, useEffect, useRef } from "react";
import { FiMenu } from "react-icons/fi";
import { RiExchangeFundsFill } from "react-icons/ri";
import "./Navbar.css";

export default function Navbar({ onMenuClick, isLoading }) {
  const [particleOffset, setParticleOffset] = useState({ x: 0, y: 0 });
  const [model, setModel] = useState(() => localStorage.getItem("mira-model") || "ion");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleModelChange = () => {
      const saved = localStorage.getItem("mira-model");
      if (saved) setModel(saved);
    };
    window.addEventListener("mira-model-change", handleModelChange);
    return () => window.removeEventListener("mira-model-change", handleModelChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const models = [
    { value: "ion", label: "Ion - Ultra Flash" },
    { value: "spark", label: "Spark - Fast" },
    { value: "quantum", label: "Quantum - Reasoning" },
    { value: "neutron", label: "Neutron - Balanced" },
    { value: "cosmos", label: "Cosmos - Advanced" },
    { value: "singularity", label: "Singularity - Maximum" },
  ];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setParticleOffset({ x: x * 0.4, y: y * 0.4 });
  };

  const handleMouseLeave = () => {
    setParticleOffset({ x: 0, y: 0 });
  };

  return (
    <nav className="navbar">
      <button className="navbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <FiMenu />
      </button>
      <div className="navbar-brand">
        <div className="logo-container" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <div className="logo-effects">
            <div className="logo-glow"></div>
            <div className="logo-particles" style={{ 
              transform: `translate(${particleOffset.x}px, ${particleOffset.y}px)`,
              transition: "transform 0.1s ease-out"
            }}>
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
          <img src="/proicon-bg.png" alt="MIRA" className={`navbar-logo ${isLoading ? "pulsing" : ""}`} />
        </div>
        <div className="navbar-text">
          <span className="navbar-subtitle">AI Assistant</span>
          <span className="navbar-title">.I.R.A.</span>
        </div>
      </div>
      <div className="navbar-actions">
        <div className="model-dropdown" ref={dropdownRef}>
          <button
            className="model-selector-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Select model"
            title="Switch Model"
            disabled={isLoading}
          >
            <RiExchangeFundsFill className={`chevron-icon ${isLoading ? "spinning" : isDropdownOpen ? "rotate" : ""}`} />
          </button>
          {isDropdownOpen && (
            <div className="model-options">
              {models.map((option) => (
                <div
                  key={option.value}
                  className={`model-option ${model === option.value ? "selected" : ""}`}
                  onClick={() => {
                    setModel(option.value);
                    localStorage.setItem("mira-model", option.value);
                    window.dispatchEvent(new Event("mira-model-change"));
                    setIsDropdownOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}