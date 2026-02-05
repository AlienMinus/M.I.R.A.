import React, { useState } from 'react';
import { FiSend, FiUser, FiType, FiFileText, FiTrash2 } from 'react-icons/fi';
import { MdAutoAwesome } from "react-icons/md";
import emailTemplates from '.../data/emails/email.json';
import './Automation.css';

export default function EmailAutomation() {
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    // Placeholder for actual email sending logic
    alert(`Email sent from ${sender} to ${recipient}`);
    setSender('');
    setRecipient('');
    setSubject('');
    setBody('');
  };

  const handleAutoGenerate = () => {
    if (!body.trim()) {
      setSubject(emailTemplates.generate.subject);
      setBody(emailTemplates.generate.body);
    } else {
      setSubject(emailTemplates.finetune.subject);
      setBody(emailTemplates.finetune.body);
    }
  };

  const handleClear = () => {
    setSender('');
    setRecipient('');
    setSubject('');
    setBody('');
  };

  return (
    <div className="automation-tool">
      <h2>Email Automation</h2>
      <form onSubmit={handleSend} className="automation-form">
        <div className="form-group">
            <label ><FiUser /> Sender</label>
            <input
                type="email"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Enter sender email"
                required
            />
        </div>
        <div className="form-group">
          <label><FiUser /> Recipient</label>
          <input 
            type="email" 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)} 
            placeholder="Enter recipient email"
            required 
          />
        </div>
        <div className="form-group">
          <label><FiType /> Subject</label>
          <input 
            type="text" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            placeholder="Email subject"
            required 
          />
        </div>
        <div className="form-group">
          <div className="message-header">
            <label><FiFileText /> Message</label>
            <button
              type="button"
              onClick={handleAutoGenerate}
              className="auto-generate-btn"
              title="Email Generator & Fine-Tuner"
            >
              <MdAutoAwesome /> {body ? "Fine-tune" : "Generate"}
            </button>
          </div>
          <textarea 
            className="custom-scrollbar"
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
            placeholder="Type your message here..."
            rows={6}
            required 
          />
          <div className="char-counter">
            {body.length} characters
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="action-btn" style={{ flex: 1 }}><FiSend /> Send Email</button>
          <button 
            type="button" 
            onClick={handleClear} 
            className="action-btn" 
            style={{ flex: 1, backgroundColor: '#3f3f46' }}
          >
            <FiTrash2 /> Clear
          </button>
        </div>
      </form>
    </div>
  );
}
