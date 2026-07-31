import React, { useState } from 'react';
import MapPage from './pages/MapPage';
import Dashboard from './pages/Dashboard';

function App() {
  const [page, setPage] = useState('map');

  return (
    <div className="App">
      <nav style={{ display: 'flex', gap: 12, padding: 16, background: '#1e293b', borderBottom: '1px solid #334155', justifyContent: 'center' }}>
        <button onClick={() => setPage('map')} style={{ background: page === 'map' ? '#10b981' : '#0f172a', color: '#e2e8f0', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
          🌍 Mappa
        </button>
        <button onClick={() => setPage('dashboard')} style={{ background: page === 'dashboard' ? '#10b981' : '#0f172a', color: '#e2e8f0', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
          📊 Dashboard
        </button>
      </nav>
      {page === 'map' && <MapPage />}
      {page === 'dashboard' && <Dashboard />}
    </div>
  );
}

export default App;
