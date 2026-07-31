import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Importa i componenti legali
import LegalDocument from './components/legal/LegalDocument';
import LegalFooter from './components/legal/LegalFooter';
import CookieBanner from './components/legal/CookieBanner';

// Importa gli altri componenti (esistenti)
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <CookieBanner />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Route per i documenti legali */}
            <Route path="/legal/:doc" element={<LegalDocument />} />
            <Route path="/terms" element={<LegalDocument />} />
            <Route path="/privacy" element={<LegalDocument />} />
            <Route path="/cookies" element={<LegalDocument />} />
          </Routes>
        </main>
        
        <LegalFooter />
      </div>
    </Router>
  );
}

export default App;
