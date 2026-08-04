import React from 'react';
import ActivityFeed from './components/ActivityFeed';

function App() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🌱 MyZubster</h1>
      <p>Decentralized Gardening Platform</p>
      <p>Backend: <a href="http://localhost:3009/dashboard">Dashboard</a></p>
      <p>API: <a href="http://localhost:3009/api/dashboard">API Dashboard</a></p>
      <div style={{ maxWidth: '640px', margin: '24px auto 0', textAlign: 'left' }}>
        <ActivityFeed />
      </div>
    </div>
  );
}

export default App;
