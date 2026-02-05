import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiArrowLeft } from "react-icons/fi";
import Automation from "../components/Automation/Automation";
import Sidebar from "../components/Sidebar/Sidebar";
import SettingsModal from "../components/SettingsModal/SettingsModal";
import "../components/Automation/Automation.css";

export default function AutomationPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatId, setChatId] = useState(() => {
    const saved = localStorage.getItem("mira-current-chat-id");
    return saved ? parseInt(saved, 10) : 0;
  });

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
        onShowApps={() => { navigate("/apps"); setMobileOpen(false); }}
        onShowAutomation={() => setMobileOpen(false)}
        currentChatId={chatId}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", backgroundColor: "#09090b" }}>
        <div className="custom-scrollbar" style={{ height: "100%", overflowY: "auto", padding: "20px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  className="apps-mobile-menu-btn" 
                  onClick={() => setMobileOpen(true)}
                  style={{ display: "none" }} // Hidden by default, shown via CSS media query if needed
                >
                  <FiMenu />
                </button>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff", margin: 0 }}>Automation</h1>
              </div>
              <button 
                onClick={() => navigate("/")}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  background: "transparent", 
                  border: "none", 
                  color: "#a1a1aa", 
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                <FiArrowLeft /> Back to Chat
              </button>
            </div>
            
            <Automation />
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
