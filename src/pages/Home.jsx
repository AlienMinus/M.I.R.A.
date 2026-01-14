import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Main from "../components/Main/Main";
import SettingsModal from "../components/SettingsModal/SettingsModal";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatId, setChatId] = useState(() => {
    const saved = localStorage.getItem("mira-current-chat-id");
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem("mira-current-chat-id", chatId);
  }, [chatId]);

  const handleSaveSettings = (settings) => {
    console.log("Saved settings:", settings);
    // Here you would typically update context or localStorage
  };

  const handleNewChat = () => {
    setChatId((prev) => prev + 1);
    setMobileOpen(false);
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
        onSelectChat={setChatId}
        currentChatId={chatId}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <Main key={chatId} chatId={chatId} onMenuClick={() => setMobileOpen(true)} />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
