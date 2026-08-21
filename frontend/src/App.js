import React, { useState } from 'react';
import LifePortalPage from './pages/LifePortalPage';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import PilotDashboardPage from './pages/PilotDashboardPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import AgentsPage from './pages/AgentsPage';

const TABS = {
  LIFE: 'life',
  PLANTS: 'plants',
  GARDENS: 'gardens',
  PILOT: 'pilot',
  BOUNTIES: 'bounties',
  AGENTS: 'agents',
};

function App() {
  const [activeTab, setActiveTab] = useState(TABS.LIFE);

  return (
    <div className="App">
      <nav style={{ padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: '#050913', borderBottom: '1px solid #1e293b' }}>
        <button onClick={() => setActiveTab(TABS.LIFE)} style={{ fontWeight: 800 }}>🌍 MyZubster LIFE</button>
        <button onClick={() => setActiveTab(TABS.PILOT)}>🧩 Pilot</button>
        <button onClick={() => setActiveTab(TABS.PLANTS)}>🌿 Piante</button>
        <button onClick={() => setActiveTab(TABS.GARDENS)}>🌱 Orti</button>
        <button onClick={() => setActiveTab(TABS.BOUNTIES)}>🤖 Bounties</button>
        <button onClick={() => setActiveTab(TABS.AGENTS)}>🧠 AI & Bots</button>
      </nav>

      {activeTab === TABS.LIFE && <LifePortalPage />}
      {activeTab === TABS.PILOT && <PilotDashboardPage />}
      {activeTab === TABS.PLANTS && <MapPage />}
      {activeTab === TABS.GARDENS && <GardensPage />}
      {activeTab === TABS.BOUNTIES && <ClowbotBountiesPage />}
      {activeTab === TABS.AGENTS && <AgentsPage />}
    </div>
  );
}

export default App;
