import React, { useState } from 'react';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import PilotDashboardPage from './pages/PilotDashboardPage';

const TABS = { PLANTS: 'plants', GARDENS: 'gardens', PILOT: 'pilot' };

function App() {
  const [activeTab, setActiveTab] = useState(TABS.PILOT);
  return (
    <div className="App">
      <nav style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>🌍 MyZubster</h1>
        <button onClick={() => setActiveTab(TABS.PILOT)}>🧩 Pilot</button>
        <button onClick={() => setActiveTab(TABS.PLANTS)}>🌿 Piante</button>
        <button onClick={() => setActiveTab(TABS.GARDENS)}>🌱 Orti & Giardini</button>
      </nav>
      {activeTab === TABS.PILOT && <PilotDashboardPage />}
      {activeTab === TABS.PLANTS && <MapPage />}
      {activeTab === TABS.GARDENS && <GardensPage />}
    </div>
  );
}

export default App;
