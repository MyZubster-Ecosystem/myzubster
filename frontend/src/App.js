import React, { useState } from 'react';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import PilotDashboardPage from './pages/PilotDashboardPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import AgentsPage from './pages/AgentsPage';
import TelemetryDashboardPage from './pages/TelemetryDashboardPage';

const TABS = {
  PLANTS: 'plants',
  GARDENS: 'gardens',
  PILOT: 'pilot',
  BOUNTIES: 'bounties',
  AGENTS: 'agents',
  TELEMETRY: 'telemetry',
};

function App() {
  const [activeTab, setActiveTab] = useState(TABS.PILOT);

  return (
    <div className="App">
      <nav style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>🌍 MyZubster</h1>
        <button onClick={() => setActiveTab(TABS.PILOT)}>🧩 Pilot</button>
        <button onClick={() => setActiveTab(TABS.PLANTS)}>🌿 Piante</button>
        <button onClick={() => setActiveTab(TABS.GARDENS)}>🌱 Orti & Giardini</button>
        <button onClick={() => setActiveTab(TABS.BOUNTIES)}>🤖 Clowbot Bounties</button>
        <button onClick={() => setActiveTab(TABS.AGENTS)}>🧠 AI & Bots</button>
        <button onClick={() => setActiveTab(TABS.TELEMETRY)}>Telemetry</button>
      </nav>

      {activeTab === TABS.PILOT && <PilotDashboardPage />}
      {activeTab === TABS.PLANTS && <MapPage />}
      {activeTab === TABS.GARDENS && <GardensPage />}
      {activeTab === TABS.BOUNTIES && <ClowbotBountiesPage />}
      {activeTab === TABS.AGENTS && <AgentsPage />}
      {activeTab === TABS.TELEMETRY && <TelemetryDashboardPage />}
    </div>
  );
}

export default App;
