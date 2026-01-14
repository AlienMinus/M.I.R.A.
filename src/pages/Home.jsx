import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import Sidebar from "../components/Sidebar/Sidebar";
import Main from "../components/Main/Main";
import SettingsModal from "../components/SettingsModal/SettingsModal";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveSettings = (settings) => {
    console.log("Saved settings:", settings);
    // Here you would typically update context or localStorage
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Mobile Hamburger Button */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <FiMenu />
      </button>

      <Main />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
