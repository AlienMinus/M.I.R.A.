import { FiBox, FiExternalLink } from "react-icons/fi";
import "./Apps.css";

export default function AppCard({ label, desc, icon: Icon, image, link }) {
  const IconComponent = Icon || FiBox;

  return (
    <div className="app-card">
      <div className="app-card-content">
        <div className="app-card-header">
          {image ? (
            <img 
              src={image} 
              alt={`${label} icon`} 
              className="app-card-image"
            />
          ) : (
            <div className="app-card-icon-placeholder"><IconComponent size={32} /></div>
          )}
          <h3 className="app-card-title">{label}</h3>
        </div>
        <p className="app-card-desc">{desc}</p>
      </div>
      
      {link && (
        <a 
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="app-visit-btn"
        >
          Try / Visit <FiExternalLink />
        </a>
      )}
    </div>
  );
}