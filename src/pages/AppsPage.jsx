import { useState } from "react";
import { FiMenu, FiArrowLeft, FiSearch } from "react-icons/fi";
import AppItems from "../components/Apps/AppItems";
import appsData from "../data/apps/apps.json";
import "../components/Apps/Apps.css";

export default function AppsPage({ onMenuClick, onBack }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = appsData.filter(app => 
    app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="apps-page">
      <div className="apps-container">
        <div className="apps-header">
          <div className="apps-header-left">
            <button 
              className="apps-mobile-menu-btn" 
              onClick={onMenuClick}
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
          <button className="apps-back-btn" onClick={onBack}>
            <FiArrowLeft /> Back to Chat
          </button>
        </div>
        
        <AppItems apps={filteredApps} />
      </div>
    </div>
  );
}