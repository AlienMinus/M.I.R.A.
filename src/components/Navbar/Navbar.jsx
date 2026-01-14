import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import "./Navbar.css";

export default function Navbar({ onMenuClick }) {
  const [particleOffset, setParticleOffset] = useState({ x: 0, y: 0 });

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
          <img src="/proicon-bg.png" alt="MIRA" className="navbar-logo" />
        </div>
        <div className="navbar-text">
          <span className="navbar-title">.I.R.A.</span>
          <span className="navbar-subtitle">AI Assistant</span>
        </div>
      </div>
    </nav>
  );
}