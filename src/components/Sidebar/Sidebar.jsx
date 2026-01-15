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
import SidebarItem from "./SidebarItem";
import ChatHistory from "./ChatHistory";
import "./Sidebar.css";

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {}, onOpenSettings, onNewChat, onSelectChat, currentChatId }) {
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

  const handleNewChat = () => {
    let maxId = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mira-chat-") && !key.startsWith("mira-chat-timestamp-")) {
        const id = parseInt(key.replace("mira-chat-", ""), 10);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      }
    }
    onSelectChat(maxId + 1);
    setMobileOpen(false);
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/proicon-bg.png" alt="MIRA" className="sidebar-logo" />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-title">.I.R.A.</span>
              </div>
            )}
          </div>
          <div className="sidebar-controls">
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              <FiSidebar />
            </button>
            <button className="mobile-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
              <FiX />
            </button>
          </div>
        </div>

        <div className="sidebar-nav">
          <SidebarItem icon={<FiPlus />} label="New chat" active collapsed={isCollapsed} onClick={handleNewChat} />
          <SidebarItem icon={<FiSearch />} label="Search chats" collapsed={isCollapsed} />
          <SidebarItem icon={<FiImage />} label="Images" collapsed={isCollapsed} />
          <SidebarItem icon={<FiGrid />} label="Apps" collapsed={isCollapsed} />
          <SidebarItem icon={<FiFolder />} label="Projects" collapsed={isCollapsed} />
        </div>

        <div className="sidebar-section">
          <ChatHistory
            currentChatId={currentChatId}
            onSelectChat={onSelectChat}
            onNewChat={onNewChat}
            setMobileOpen={setMobileOpen}
            isCollapsed={isCollapsed}
            mobileOpen={mobileOpen}
          />
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
