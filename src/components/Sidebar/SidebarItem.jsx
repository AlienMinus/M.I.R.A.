import { FiTrash2 } from "react-icons/fi";
import "./Sidebar.css";

export default function SidebarItem({ icon, label, active, collapsed, onClick, onDelete, innerRef }) {
  return (
    <div 
      className={`sidebar-item ${active ? "active" : ""}`} 
      title={collapsed ? label : ""} 
      onClick={onClick} 
      ref={innerRef}
    >
      {icon && <span className="icon">{icon}</span>}
      {!collapsed && <span className="sidebar-label">{label}</span>}
      {!collapsed && onDelete && (
        <button className="delete-chat-btn" onClick={onDelete} aria-label="Delete chat">
          <FiTrash2 />
        </button>
      )}
    </div>
  );
}
