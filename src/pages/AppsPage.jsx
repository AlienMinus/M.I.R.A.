import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiArrowLeft, FiSearch } from "react-icons/fi";
import AppItems from "../components/Apps/AppItems";
import Sidebar from "../components/Sidebar/Sidebar";
import SettingsModal from "../components/SettingsModal/SettingsModal";
import appsData from "../data/apps/apps.json";
import "../components/Apps/Apps.css";

export default function AppsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatId, setChatId] = useState(() => {
    const saved = localStorage.getItem("mira-current-chat-id");
    return saved ? parseInt(saved, 10) : 0;
  });

  const filteredApps = appsData.filter(app => 
    app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const newId = maxId + 1;
    localStorage.setItem("mira-current-chat-id", newId);
    navigate("/");
  };

  const handleSelectChat = (id) => {
    localStorage.setItem("mira-current-chat-id", id);
    navigate("/");
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("mira-chat-")) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem("mira-current-chat-id");
      setChatId(0);
      setIsSettingsOpen(false);
      window.location.reload();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onShowApps={() => setMobileOpen(false)}
        currentChatId={chatId}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div className="apps-page">
          <div className="apps-container">
            <div className="apps-header">
              <div className="apps-header-left">
                <button 
                  className="apps-mobile-menu-btn" 
                  onClick={() => setMobileOpen(true)}
                >
                  <FiMenu />
                </button>
                <h1 className="apps-title">Apps</h1>
              </div>
              <div className="apps-search-box">
                <FiSearch className="apps-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search apps..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="apps-search-input"
                />
              </div>
              <button className="apps-back-btn" onClick={() => navigate("/")}>
                <FiArrowLeft /> Back to Chat
              </button>
            </div>
            
            <AppItems apps={filteredApps} />
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => console.log("Saved settings:", settings)}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}