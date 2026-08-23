import React, { useState } from 'react';
import SimpleHomePage from './pages/SimpleHomePage';
import LifePortalPage from './pages/LifePortalPage';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import PilotDashboardPage from './pages/PilotDashboardPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import AgentsPage from './pages/AgentsPage';

function App() {
  const [screen, setScreen] = useState('simple');
  const [legacy, setLegacy] = useState(null);

  if (screen === 'simple') {
    return <SimpleHomePage onExplore={() => setScreen('ecosystem')} />;
  }

  if (!legacy) {
    return (
      <div>
        <nav style={{ padding: '10px 16px', background: '#061019', borderBottom: '1px solid #1e293b' }}>
          <button onClick={() => setScreen('simple')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #315068', background: '#122737', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>← Spiegami MyZubster in 30 secondi</button>
        </nav>
        <LifePortalPage openLegacy={setLegacy} />
      </div>
    );
  }

  return (
    <div className="App">
      <nav style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: '#071018', borderBottom: '1px solid #1e293b' }}>
        <button onClick={() => setLegacy(null)} style={{ padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 800 }}>← MyZubster Ecosystem</button>
        <button onClick={() => { setLegacy(null); setScreen('simple'); }} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #315068', background: '#122737', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>30-second home</button>
        <span style={{ color: '#cbd5e1' }}>Area operativa</span>
      </nav>
      {legacy === 'pilot' && <PilotDashboardPage />}
      {legacy === 'plants' && <MapPage />}
      {legacy === 'gardens' && <GardensPage />}
      {legacy === 'bounties' && <ClowbotBountiesPage />}
      {legacy === 'agents' && <AgentsPage />}
    </div>
  );
}

export default App;
