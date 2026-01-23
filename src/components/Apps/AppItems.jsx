import AppCard from "./AppCard";
import "./Apps.css";

export default function AppItems({ apps = [] }) {
  return (
    <div className="apps-grid">
      {apps.map((app) => (
        <AppCard
          key={app.id}
          label={app.label}
          desc={app.desc}
          link={app.link}
          image={app.image}
        />
      ))}
    </div>
  );
}