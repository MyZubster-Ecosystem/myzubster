import React, { useEffect, useState } from 'react';
import LifePortalPage from './pages/LifePortalPage';
import IdentityOnboardingPage from './pages/IdentityOnboardingPage';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import PilotDashboardPage from './pages/PilotDashboardPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import AgentsPage from './pages/AgentsPage';
import AppsDownloadPage from './pages/AppsDownloadPage';

const PORTAL_VIEWS = {
  '/': 'home',
  '/account': 'register',
  '/comuni': 'municipality',
  '/orti': 'gardens',
  '/repositories': 'repos',
  '/life': 'life',
};

const OPERATIONAL_VIEWS = {
  '/pilot': 'pilot',
  '/gardens': 'gardens',
  '/plants': 'plants',
  '/bounties': 'bounties',
};

const OPERATIONAL_PATHS = Object.fromEntries(
  Object.entries(OPERATIONAL_VIEWS).map(([path, view]) => [view, path])
);

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function App() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const handlePopState = () => setPath(currentPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${path}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    const openGraphUrl = document.querySelector('meta[property="og:url"]');
    if (canonical) canonical.setAttribute('href', canonicalUrl);
    if (openGraphUrl) openGraphUrl.setAttribute('content', canonicalUrl);
  }, [path]);

  const navigate = (nextPath, { replace = false } = {}) => {
    const normalized = nextPath.replace(/\/+$/, '') || '/';
    if (normalized !== currentPath()) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', normalized);
    }
    setPath(normalized);
    window.scrollTo(0, 0);
  };

  if (path === '/apps' || path === '/download') {
    return <AppsDownloadPage />;
  }

  if (['/entities', '/agents', '/assistants'].includes(path)) {
    return <AgentsPage />;
  }

  if (path === '/onboarding') {
    return (
      <IdentityOnboardingPage
        onSkip={() => navigate('/')}
        onContinue={() => navigate('/', { replace: true })}
      />
    );
  }

  const operationalView = OPERATIONAL_VIEWS[path];
  if (operationalView) {
    return (
      <div className="App">
        <nav style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: '#071018', borderBottom: '1px solid #1e293b' }}>
          <button onClick={() => navigate('/')} style={{ padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 800 }}>← MyZubster Home</button>
          <a href="/apps" style={{ padding: '10px 14px', borderRadius: 10, color: '#fff', textDecoration: 'none', background: '#0e7490', fontWeight: 800 }}>Scarica App</a>
          <span style={{ color: '#cbd5e1' }}>Area operativa</span>
        </nav>
        {operationalView === 'pilot' && <PilotDashboardPage />}
        {operationalView === 'plants' && <MapPage />}
        {operationalView === 'gardens' && <GardensPage />}
        {operationalView === 'bounties' && <ClowbotBountiesPage />}
      </div>
    );
  }

  const portalView = PORTAL_VIEWS[path] || 'home';
  return (
    <LifePortalPage
      initialView={portalView}
      onNavigate={navigate}
      openLegacy={(view) => navigate(OPERATIONAL_PATHS[view] || '/')}
    />
  );
}

export default App;
