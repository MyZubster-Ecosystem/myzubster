import React, { useEffect, useState } from 'react';

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

function authToken() {
  try { return localStorage.getItem('myzubster-token') || ''; } catch (_error) { return ''; }
}

async function api(path, options = {}) {
  const token = authToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || 'Operazione wallet non riuscita');
  return data;
}

function WalletHubPanel({ compact = false }) {
  const [walletState, setWalletState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const copy = async (address) => {
    if (!address || !navigator.clipboard) return;
    await navigator.clipboard.writeText(address);
  };

  const refreshWallet = async () => {
    if (!authToken()) {
      setWalletState(null);
      return;
    }
    try {
      const result = await api('/api/wallet/me');
      setWalletState(result.data || null);
    } catch (error) {
      setNotice(error.message);
    }
  };

  useEffect(() => { refreshWallet(); }, []);

  const connectMetaMask = async () => {
    if (!authToken()) {
      setNotice('Accedi a MyZubster prima di collegare MetaMask.');
      return;
    }
    if (!window.ethereum?.request) {
      setNotice('MetaMask non è disponibile in questo browser.');
      return;
    }

    setBusy(true);
    setNotice('Connessione a MetaMask…');
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts?.[0];
      if (!address) throw new Error('Nessun account MetaMask disponibile');

      const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = Number.parseInt(String(chainHex), 16);
      const challenge = await api('/api/wallet/challenge', {
        method: 'POST',
        body: JSON.stringify({ address, chainId })
      });

      setNotice('Firma il messaggio in MetaMask. Non è un pagamento e non usa gas.');
      const message = challenge.data.message;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      const verified = await api('/api/wallet/verify', {
        method: 'POST',
        body: JSON.stringify({ address, message, signature })
      });
      setWalletState(verified.data);
      setNotice('Wallet MetaMask verificato e collegato al tuo account MyZubster.');
    } catch (error) {
      setNotice(error?.message || 'Connessione MetaMask annullata o non riuscita.');
      await refreshWallet();
    } finally {
      setBusy(false);
    }
  };

  const disconnectMetaMask = async () => {
    if (!authToken()) return;
    setBusy(true);
    try {
      const result = await api('/api/wallet/disconnect', { method: 'DELETE' });
      setWalletState(result.data);
      setNotice('Wallet scollegato da MyZubster. MetaMask resta installato e controllato da te.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const verified = walletState?.status === 'WALLET_VERIFIED';

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
          MyZubster non richiede mai seed phrase o private key. Una firma MetaMask dimostra il controllo del wallet,
          ma non autorizza un pagamento e non spende ETH.
        </p>
      )}

      <article style={{ border: '1px solid rgba(127,127,127,.32)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <strong>Il tuo wallet ETH / EVM</strong>
            <div style={{ marginTop: 4, opacity: .8 }}>
              {verified ? `Verificato · ${shortAddress(walletState.address)}` : 'Non verificato'}
            </div>
          </div>
          {verified ? (
            <button type="button" disabled={busy} onClick={disconnectMetaMask}>Scollega wallet</button>
          ) : (
            <button type="button" disabled={busy} onClick={connectMetaMask}>
              {busy ? 'Verifica…' : 'Connetti MetaMask'}
            </button>
          )}
        </div>
        {verified && (
          <small style={{ display: 'block', marginTop: 8, opacity: .75 }}>
            Controllo wallet verificato tramite firma off-chain · chain ID {walletState.chainId || '—'}
          </small>
        )}
        {notice && <div role="status" style={{ marginTop: 10 }}>{notice}</div>}
      </article>

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
