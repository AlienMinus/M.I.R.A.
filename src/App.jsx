import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import NotFound from './NotFound';

function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<h1>Hello</h1>} />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
