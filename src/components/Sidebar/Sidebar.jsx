import { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiMessageSquare,
  FiImage,
  FiGrid,
  FiFolder,
  FiSidebar,
  FiX,
  FiSettings
} from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {}, onOpenSettings, onNewChat, onSelectChat, currentChatId }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [savedChats, setSavedChats] = useState([]);

  useEffect(() => {
    const loadChats = () => {
      const chats = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("mira-chat-")) {
          const id = parseInt(key.replace("mira-chat-", ""), 10);
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const messages = JSON.parse(stored);
              if (Array.isArray(messages) && messages.length > 0) {
                const firstUserMsg = messages.find((m) => m.role === "user");
                const title = firstUserMsg
                  ? firstUserMsg.text.slice(0, 24) + (firstUserMsg.text.length > 24 ? "..." : "")
                  : "New Chat";
                chats.push({ id, title });
              }
            }
          } catch (e) {
            console.error("Failed to parse chat", key);
          }
        }
      }
      chats.sort((a, b) => b.id - a.id);
      setSavedChats(chats);
    };

    loadChats();
  }, [currentChatId, mobileOpen]);

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
      <SidebarItem icon={<FiPlus />} label="New chat" active collapsed={isCollapsed} onClick={onNewChat} />
          <SidebarItem icon={<FiSearch />} label="Search chats" collapsed={isCollapsed} />
          <SidebarItem icon={<FiImage />} label="Images" collapsed={isCollapsed} />
          <SidebarItem icon={<FiGrid />} label="Apps" collapsed={isCollapsed} />
          <SidebarItem icon={<FiFolder />} label="Projects" collapsed={isCollapsed} />

          {!isCollapsed && savedChats.length > 0 && (
            <div style={{ padding: "16px 12px 8px", fontSize: "0.75rem", color: "#71717a", fontWeight: 600, letterSpacing: "0.5px" }}>
              HISTORY
            </div>
          )}
          {savedChats.map((chat) => (
            <SidebarItem
              key={chat.id}
              icon={<FiMessageSquare />}
              label={chat.title}
              active={chat.id === currentChatId}
              collapsed={isCollapsed}
              onClick={() => { onSelectChat(chat.id); setMobileOpen(false); }}
            />
          ))}
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

function SidebarItem({ icon, label, active, collapsed, onClick }) {
  return (
    <div className={`sidebar-item ${active ? "active" : ""}`} title={collapsed ? label : ""} onClick={onClick}>
      {icon && <span className="icon">{icon}</span>}
      {!collapsed && <span>{label}</span>}
    </div>
  );
}
