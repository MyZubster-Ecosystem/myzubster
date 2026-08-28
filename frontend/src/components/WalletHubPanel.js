import React from 'react';

const WALLETS = [
  {
    asset: 'ETH',
    network: 'Ethereum mainnet',
    address: process.env.REACT_APP_WALLET_ETH || '',
    env: 'REACT_APP_WALLET_ETH'
  },
  {
    asset: 'BTC',
    network: 'Bitcoin mainnet',
    address: process.env.REACT_APP_WALLET_BTC || 'bc1ql0d4hxdqt9cvawx635rwfykxap8juaz94nujl2',
    env: 'REACT_APP_WALLET_BTC'
  },
  {
    asset: 'XMR',
    network: 'Monero mainnet',
    address: process.env.REACT_APP_WALLET_XMR || '46BFA8gGga2ADAv8NV49CB6uwNaRdVaVpgMvof4x3nNUAGKSxwuXVtJETxVRqfPWWWATPTzc7ciEoFicAKrWqvaPBXQGoxH',
    env: 'REACT_APP_WALLET_XMR'
  },
  {
    asset: 'TARI',
    network: 'Tari',
    address: process.env.REACT_APP_WALLET_TARI || '',
    env: 'REACT_APP_WALLET_TARI'
  }
];

function shortAddress(address) {
  if (!address) return 'Da configurare';
  if (address.length <= 24) return address;
  return `${address.slice(0, 12)}…${address.slice(-10)}`;
}

function WalletHubPanel({ compact = false }) {
  const copy = async (address) => {
    if (!address || !navigator.clipboard) return;
    await navigator.clipboard.writeText(address);
  };

  return (
    <section
      aria-label="MyZubster multichain wallet hub"
      style={{
        border: '1px solid rgba(127,127,127,.3)',
        borderRadius: 14,
        padding: compact ? 14 : 18,
        marginBottom: 20,
        background: 'rgba(127,127,127,.04)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <small style={{ letterSpacing: 1.2, opacity: .7 }}>METAVERSE WALLET HUB</small>
          <h3 style={{ margin: '4px 0 6px' }}>Wallet multichain del Market</h3>
        </div>
        <strong>Non-custodial</strong>
      </div>

      {!compact && (
        <p style={{ marginTop: 0 }}>
          Il Market espone solo indirizzi pubblici di ricezione. Seed, private key e firme restano fuori dal frontend e dal repository.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
        {WALLETS.map((wallet) => (
          <article key={wallet.asset} style={{ border: '1px solid rgba(127,127,127,.25)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong>{wallet.asset}</strong>
              <small>{wallet.network}</small>
            </div>
            <code title={wallet.address || wallet.env} style={{ display: 'block', margin: '10px 0', overflowWrap: 'anywhere' }}>
              {shortAddress(wallet.address)}
            </code>
            {wallet.address ? (
              <button type="button" onClick={() => copy(wallet.address)}>Copia indirizzo</button>
            ) : (
              <small>Configura {wallet.env} nel deployment.</small>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export { WALLETS };
export default WalletHubPanel;
