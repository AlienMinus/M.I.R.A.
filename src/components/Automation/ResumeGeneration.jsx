import React, { useState } from 'react';
import { FiDownload, FiUser, FiBriefcase, FiAward } from 'react-icons/fi';
import './Automation.css';

export default function ResumeGeneration() {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');

  const handleGenerate = (e) => {
    e.preventDefault();
    // Placeholder for resume generation logic
    alert('Resume generated successfully!');
  };

  return (
    <div className="automation-tool">
      <h2>Resume Generation</h2>
      <form onSubmit={handleGenerate} className="automation-form">
        <div className="form-group">
          <label><FiUser /> Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="John Doe"
            required 
          />
        </div>
        <div className="form-group">
          <label><FiBriefcase /> Experience</label>
          <textarea 
            value={experience} 
            onChange={(e) => setExperience(e.target.value)} 
            placeholder="Describe your work experience..."
            rows={4}
          />
        </div>
        <div className="form-group">
          <label><FiAward /> Skills</label>
          <input 
            type="text" 
            value={skills} 
            onChange={(e) => setSkills(e.target.value)} 
            placeholder="React, Node.js, Python..."
          />
        </div>
        <button type="submit" className="action-btn"><FiDownload /> Generate Resume</button>
      </form>
    </div>
  );
}
