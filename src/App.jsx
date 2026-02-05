import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AppsPage from "./pages/AppsPage";
import AutomationPage from "./pages/AutomationPage";
import NotFound from "./NotFound";
import "./App.css";

function App() {

  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
