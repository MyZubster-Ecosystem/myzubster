import React, { useState } from 'react';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import MetaversePage from './pages/MetaversePage';

const TABS = {
  WORLD: 'world',
  EXPLORE: 'explore',
  GARDENS: 'gardens',
  MISSIONS: 'missions'
};

function App() {
  // Public visitors land directly in MyZubster World. Technical/admin surfaces
  // stay out of the primary navigation so the product does not require users
  // to understand the repository architecture before participating.
  const [activeTab, setActiveTab] = useState(TABS.WORLD);

  return (
    <div className="App">
      <nav style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} aria-label="MyZubster main navigation">
        <h1 style={{ margin: 0, fontSize: 20 }}>🌍 MyZubster</h1>
        <button onClick={() => setActiveTab(TABS.WORLD)}>Entra</button>
        <button onClick={() => setActiveTab(TABS.EXPLORE)}>Esplora</button>
        <button onClick={() => setActiveTab(TABS.GARDENS)}>Il mio giardino</button>
        <button onClick={() => setActiveTab(TABS.MISSIONS)}>Missioni</button>
      </nav>

      {activeTab === TABS.WORLD && <MetaversePage />}
      {activeTab === TABS.EXPLORE && <MapPage />}
      {activeTab === TABS.GARDENS && <GardensPage />}
      {activeTab === TABS.MISSIONS && <ClowbotBountiesPage />}
    </div>
  );
}

export default App;
