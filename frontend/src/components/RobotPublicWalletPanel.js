import React from 'react';
import { WALLETS } from './WalletHubPanel';

const ROBOTS = [
  {
    id: 'eva-ioni',
    name: 'EVA IONI',
    description: 'Robotica ambientale, telemetria e automazione sperimentale.',
    repository: 'https://github.com/MyZubster-Ecosystem/EVA-IONI'
  },
  {
    id: 'myzubster-robot',
    name: 'MyZubster Robot',
    description: 'Track open-source per robotica, simulazione e integrazione hardware.',
    repository: 'https://github.com/MyZubster-Ecosystem/MyZubster-Robot'
  }
];

const PUBLIC_ROBOT_WALLETS = WALLETS.filter((wallet) => ['BTC', 'XMR'].includes(wallet.asset) && wallet.address);

function shortAddress(address) {
  if (!address) return 'Non configurato';
  if (address.length <= 28) return address;
  return `${address.slice(0, 14)}…${address.slice(-12)}`;
}

function trackRobotWalletEvent(action, robot, asset) {
  if (typeof window.va === 'function') {
    window.va('event', {
      name: 'Robot Public Wallet',
      data: { action, robot, asset: asset || 'repository' }
    });
  }
}

function RobotPublicWalletPanel() {
  const copy = async (robot, wallet) => {
    if (!wallet.address || !navigator.clipboard) return;
    await navigator.clipboard.writeText(wallet.address);
    trackRobotWalletEvent('copy', robot.id, wallet.asset);
  };

  return (
    <section
      id="robot-wallets"
      aria-labelledby="robot-wallets-title"
      style={{
        margin: '0 20px 20px',
        padding: 22,
        borderRadius: 18,
        border: '1px solid rgba(59, 130, 246, 0.35)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.10), rgba(245, 158, 11, 0.10))'
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.08em', opacity: 0.78 }}>
        ROBOT IDENTITIES · PUBLIC RECEIVE ADDRESSES
      </div>
      <h2 id="robot-wallets-title" style={{ margin: '6px 0 8px' }}>
        🤖 EVA IONI + MyZubster Robot · XMR & Bitcoin
      </h2>
      <p style={{ marginTop: 0, lineHeight: 1.55, maxWidth: 980 }}>
        I due track robotici sono collegati agli indirizzi pubblici di ricezione dell'ecosistema MyZubster già esposti nel Wallet Hub.
        Gli indirizzi sono riferimenti pubblici dell'ecosistema: non contengono seed o private key e non attribuiscono ai robot autorità autonoma di spesa, firma o settlement.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 14 }}>
        {ROBOTS.map((robot) => (
          <article key={robot.id} style={{ border: '1px solid rgba(127,127,127,.28)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 18 }}>{robot.name}</strong>
              <a
                href={robot.repository}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackRobotWalletEvent('repository', robot.id)}
              >
                GitHub →
              </a>
            </div>
            <p style={{ margin: '8px 0 14px', opacity: 0.82 }}>{robot.description}</p>

            <div style={{ display: 'grid', gap: 10 }}>
              {PUBLIC_ROBOT_WALLETS.map((wallet) => (
                <div key={`${robot.id}-${wallet.asset}`} style={{ borderTop: '1px solid rgba(127,127,127,.2)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{wallet.asset}</strong>
                    <small>{wallet.network}</small>
                  </div>
                  <code title={wallet.address} style={{ display: 'block', margin: '7px 0', overflowWrap: 'anywhere' }}>
                    {shortAddress(wallet.address)}
                  </code>
                  <button type="button" onClick={() => copy(robot, wallet)}>
                    Copia {wallet.asset}
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p style={{ marginBottom: 0, marginTop: 14, fontSize: 13, opacity: 0.75 }}>
        Boundary: public receive reference ≠ robot-controlled wallet ≠ autonomous payment authorization.
      </p>
    </section>
  );
}

export { ROBOTS, PUBLIC_ROBOT_WALLETS };
export default RobotPublicWalletPanel;
