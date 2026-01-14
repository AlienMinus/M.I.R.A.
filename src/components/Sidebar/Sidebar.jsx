import { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiImage,
  FiGrid,
  FiFolder,
  FiSidebar,
  FiX,
  FiSettings
} from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {}, onOpenSettings }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleMediaChange = (e) => setCollapsed(e.matches);

    setCollapsed(mediaQuery.matches); // Initial check

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  // Force expanded view when mobile menu is open so users can see labels
  const isCollapsed = mobileOpen ? false : collapsed;

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <FiSidebar />
          </button>
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
            <FiX />
          </button>
        </div>

        <div className="sidebar-section">
          <SidebarItem icon={<FiPlus />} label="New chat" active collapsed={isCollapsed} />
          <SidebarItem icon={<FiSearch />} label="Search chats" collapsed={isCollapsed} />
          <SidebarItem icon={<FiImage />} label="Images" collapsed={isCollapsed} />
          <SidebarItem icon={<FiGrid />} label="Apps" collapsed={isCollapsed} />
          <SidebarItem icon={<FiFolder />} label="Projects" collapsed={isCollapsed} />
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">MS</div>
            {!isCollapsed && <span>Minus Speed</span>}
          </div>
          {!isCollapsed && (
            <button className="settings-btn" onClick={onOpenSettings} aria-label="Settings">
              <FiSettings />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ icon, label, active, collapsed }) {
  return (
    <div className={`sidebar-item ${active ? "active" : ""}`} title={collapsed ? label : ""}>
      {icon && <span className="icon">{icon}</span>}
      {!collapsed && <span>{label}</span>}
    </div>
  );
}
