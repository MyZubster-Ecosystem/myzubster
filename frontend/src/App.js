<<<<<<< HEAD
import React from 'react';
=======
import React, { useState } from 'react';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';

const TABS = {
  PLANTS: 'plants',
  GARDENS: 'gardens',
};
>>>>>>> 6561d1d (feat: Geolocalizzazione bounty #17  Implementazione della funzionalità di geolocalizzazione per il bounty #17.  ## Novità - Modello Garden con indice 2dsphere (GeoJSON Point) e indice text - Integrazione OSM Nominatim per geocoding e reverse geocoding - Campo address per ogni garden - GET /api/gardens/search?q=... (ricerca testuale + fallback geocoding) - GET /api/gardens/nearby?lat=...&lng=...&radius=... (query geospaziali) - GET /api/gardens/geocode?q=... (utility di geocoding) - CRUD completo: POST, GET, GET/:id, PUT, DELETE /api/gardens - 36 test (coprono geocoding, search, nearby, CRUD, edge case)  Co-authored-by: CloudPaw-Master <cloud-orchestrator>)

function App() {
  const [activeTab, setActiveTab] = useState(TABS.PLANTS);

  return (
<<<<<<< HEAD
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🌱 MyZubster</h1>
      <p>Decentralized Gardening Platform</p>
      <p>Backend: <a href="http://localhost:3009/dashboard">Dashboard</a></p>
      <p>API: <a href="http://localhost:3009/api/dashboard">API Dashboard</a></p>
=======
    <div className="App">
      {/* Navigazione */}
      <nav style={{
        background: '#2e7d32',
        padding: '12px 20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
          🌍 MyZubster
        </h1>
        <button
          onClick={() => setActiveTab(TABS.PLANTS)}
          style={{
            padding: '8px 16px',
            background: activeTab === TABS.PLANTS ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeTab === TABS.PLANTS ? 'bold' : 'normal',
          }}
        >
          🌿 Piante
        </button>
        <button
          onClick={() => setActiveTab(TABS.GARDENS)}
          style={{
            padding: '8px 16px',
            background: activeTab === TABS.GARDENS ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeTab === TABS.GARDENS ? 'bold' : 'normal',
          }}
        >
          🌱 Orti & Giardini
        </button>
      </nav>

      {/* Contenuto */}
      {activeTab === TABS.PLANTS && <MapPage />}
      {activeTab === TABS.GARDENS && <GardensPage />}
>>>>>>> 6561d1d (feat: Geolocalizzazione bounty #17  Implementazione della funzionalità di geolocalizzazione per il bounty #17.  ## Novità - Modello Garden con indice 2dsphere (GeoJSON Point) e indice text - Integrazione OSM Nominatim per geocoding e reverse geocoding - Campo address per ogni garden - GET /api/gardens/search?q=... (ricerca testuale + fallback geocoding) - GET /api/gardens/nearby?lat=...&lng=...&radius=... (query geospaziali) - GET /api/gardens/geocode?q=... (utility di geocoding) - CRUD completo: POST, GET, GET/:id, PUT, DELETE /api/gardens - 36 test (coprono geocoding, search, nearby, CRUD, edge case)  Co-authored-by: CloudPaw-Master <cloud-orchestrator>)
    </div>
  );
}

export default App;
