import React, { useState } from 'react';
import LifePortalPage from './pages/LifePortalPage';
import IdentityOnboardingPage from './pages/IdentityOnboardingPage';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import PilotDashboardPage from './pages/PilotDashboardPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import AgentsPage from './pages/AgentsPage';
import AppsDownloadPage from './pages/AppsDownloadPage';

function App() {
  const [legacy, setLegacy] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('myzubster-onboarding-seen') !== '1');

  if (window.location.pathname === '/apps' || window.location.pathname === '/download') {
    return <AppsDownloadPage />;
  }

  if (showOnboarding) {
    return (
      <IdentityOnboardingPage
        onSkip={() => {
          localStorage.setItem('myzubster-onboarding-seen', '1');
          setShowOnboarding(false);
        }}
        onContinue={() => setShowOnboarding(false)}
      />
    );
  }

  if (!legacy) {
    return <LifePortalPage openLegacy={setLegacy} />;
  }

  return (
    <div className="App">
      <nav style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: '#071018', borderBottom: '1px solid #1e293b' }}>
        <button onClick={() => setLegacy(null)} style={{ padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 800 }}>← MyZubster Home</button>
        <a href="/apps" style={{ padding: '10px 14px', borderRadius: 10, color: '#fff', textDecoration: 'none', background: '#0e7490', fontWeight: 800 }}>Scarica App</a>
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
