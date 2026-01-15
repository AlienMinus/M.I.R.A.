import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import "./Sidebar.css";

export default function SidebarItem({ icon, label, active, collapsed, onClick, onDelete, innerRef }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e) => {
    if (collapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 10
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div 
      className={`sidebar-item ${active ? "active" : ""}`} 
      onClick={onClick} 
      ref={innerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {icon && <span className="icon">{icon}</span>}
      {!collapsed && <span className="sidebar-label">{label}</span>}
      {!collapsed && onDelete && (
        <button className="delete-chat-btn" onClick={onDelete} aria-label="Delete chat">
          <FiTrash2 />
        </button>
      )}
      {collapsed && showTooltip && (
        <div 
          className="sidebar-tooltip"
          style={{ 
            top: tooltipPos.top, 
            left: tooltipPos.left 
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
