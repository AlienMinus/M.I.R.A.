import React, { useState } from 'react';
import { FiMail, FiFileText } from 'react-icons/fi';
import EmailAutomation from './EmailAutomation';
import ResumeGeneration from './ResumeGeneration';
import './Automation.css';

export default function Automation() {
  const [activeTab, setActiveTab] = useState('email');

  return (
    <div className="automation-container">
      <div className="automation-tabs">
        <button 
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <FiMail /> Email Automation
        </button>
        <button 
          className={`tab-btn ${activeTab === 'resume' ? 'active' : ''}`}
          onClick={() => setActiveTab('resume')}
        >
          <FiFileText /> Resume Generation
        </button>
      </div>
      <div className="automation-content">
        {activeTab === 'email' ? <EmailAutomation /> : <ResumeGeneration />}
      </div>
    </div>
  );
}
