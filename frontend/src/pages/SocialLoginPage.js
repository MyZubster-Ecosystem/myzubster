import React, { useState } from 'react';

function SocialLoginPage() {
  const [status, setStatus] = useState('Accedi con email e password MyZubster.');
  const [tone, setTone] = useState('#cbd5e1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(event) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setTone('#fca5a5');
      setStatus('Inserisci email e password.');
      return;
    }

    setLoading(true);
    setTone('#cbd5e1');
    setStatus('Accesso MyZubster in corso…');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.data?.token) {
        throw new Error(data.message || 'Login non riuscito');
      }

      localStorage.setItem('myzubster-token', data.data.token);
      localStorage.setItem('myzubster-identity-provider', 'password');
      if (data.data.user) localStorage.setItem('myzubster-user', JSON.stringify(data.data.user));
      if (data.data.character?.characterId) {
        localStorage.setItem('myzubster-metaverse-character-id', data.data.character.characterId);
      } else {
        localStorage.removeItem('myzubster-metaverse-character-id');
      }

      setTone('#86efac');
      setStatus('✓ Login effettuato. Apertura Zorgax…');
      setPassword('');
      setTimeout(() => window.location.assign('/zorgax'), 500);
    } catch (error) {
      setTone('#fca5a5');
      setStatus(error.message || 'Login non riuscito.');
    } finally {
      setLoading(false);
    }
  }

  const button = {
    display: 'block', width: '100%', textAlign: 'center', color: '#fff',
    background: '#17263b', border: '1px solid #34465f', borderRadius: 12,
    padding: '13px 16px', fontWeight: 800
  };

  const input = {
    width: '100%', boxSizing: 'border-box', color: '#f8fafc', background: '#070b16',
    border: '1px solid #34465f', borderRadius: 12, padding: '13px 14px', fontSize: 15
  };

  return (
    <main style={{ minHeight: '100vh', background: '#070b16', color: '#f8fafc', display: 'grid', placeItems: 'center', padding: 20 }}>
      <section style={{ width: 'min(92vw,540px)', background: '#0d1726', border: '1px solid #26364b', borderRadius: 20, padding: 28 }}>
        <div style={{ fontSize: 12, letterSpacing: 1.4, color: '#67e8f9', fontWeight: 900 }}>MYZUBSTER · ZORGAX IDENTITY</div>
        <h1 style={{ marginBottom: 10 }}>Accedi a MyZubster</h1>
        <p style={{ color: '#aebdca', lineHeight: 1.5 }}>Inserisci le credenziali del tuo account MyZubster. I provider OAuth non configurati non vengono mostrati.</p>

        <form onSubmit={handlePasswordLogin} style={{ display: 'grid', gap: 10, margin: '22px 0' }}>
          <input
            style={input}
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            disabled={loading}
          />
          <input
            style={input}
            type="password"
            autoComplete="current-password"
            placeholder="Password MyZubster"
            value={password}
            onChange={event => setPassword(event.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading} style={{ ...button, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Accesso…' : 'Accedi con email e password'}
          </button>
        </form>

        <div style={{ padding: 12, borderRadius: 10, background: '#0a1220', color: tone }}>{status}</div>
        <p style={{ fontSize: 13, color: '#7f91a6', marginTop: 18 }}>La password viene inviata solo all'endpoint di autenticazione MyZubster e non viene salvata nel browser.</p>
        <a href="/" style={{ color: '#67e8f9' }}>← Torna a MyZubster</a>
      </section>
    </main>
  );
}

export default SocialLoginPage;
