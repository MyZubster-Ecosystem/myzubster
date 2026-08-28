import React, { useEffect, useState } from 'react';

function SocialLoginPage() {
  const [status, setStatus] = useState('Scegli un provider per continuare.');
  const [tone, setTone] = useState('#cbd5e1');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('social_login');
    const ticket = params.get('social_login_ticket');
    const provider = params.get('provider');

    if (state === 'error') {
      setTone('#fca5a5');
      setStatus(params.get('social_login_message') || 'Login non riuscito.');
      return;
    }
    if (state !== 'verified' || !ticket) return;

    setStatus('Verifica account e Metaverse in corso…');
    fetch('/api/auth/social/exchange-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket })
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Ticket non valido');
        localStorage.setItem('myzubster-token', data.data.token);
        localStorage.setItem('myzubster-metaverse-character-id', data.data.characterId);
        localStorage.setItem('myzubster-identity-provider', data.data.provider || provider || 'social');
        setTone('#86efac');
        setStatus('✓ Account verificato. Zorgax ha collegato la tua identità al Metaverse.');
        window.history.replaceState({}, document.title, '/social-login');
        setTimeout(() => window.location.assign('/onboarding'), 900);
      })
      .catch(error => {
        setTone('#fca5a5');
        setStatus(error.message || 'Login non riuscito.');
      });
  }, []);

  const button = {
    display: 'block', textAlign: 'center', textDecoration: 'none', color: '#fff',
    background: '#17263b', border: '1px solid #34465f', borderRadius: 12,
    padding: '13px 16px', fontWeight: 800
  };

  return (
    <main style={{ minHeight: '100vh', background: '#070b16', color: '#f8fafc', display: 'grid', placeItems: 'center', padding: 20 }}>
      <section style={{ width: 'min(92vw,540px)', background: '#0d1726', border: '1px solid #26364b', borderRadius: 20, padding: 28 }}>
        <div style={{ fontSize: 12, letterSpacing: 1.4, color: '#67e8f9', fontWeight: 900 }}>MYZUBSTER · ZORGAX IDENTITY</div>
        <h1 style={{ marginBottom: 10 }}>Accedi o registrati</h1>
        <p style={{ color: '#aebdca', lineHeight: 1.5 }}>Usa un account OAuth verificato. Al primo accesso Zorgax crea il tuo account MyZubster e collega un personaggio persistente nel Metaverse.</p>
        <div style={{ display: 'grid', gap: 10, margin: '22px 0' }}>
          <a style={button} href="/api/auth/social/google/start">Continua con Google</a>
          <a style={button} href="/api/auth/social/github/start">Continua con GitHub</a>
          <a style={button} href="/api/auth/social/facebook/start">Continua con Facebook</a>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: '#0a1220', color: tone }}>{status}</div>
        <p style={{ fontSize: 13, color: '#7f91a6', marginTop: 18 }}>Il login non salva token OAuth del provider, password social, seed phrase o chiavi private nel profilo pubblico.</p>
        <a href="/" style={{ color: '#67e8f9' }}>← Torna a MyZubster</a>
      </section>
    </main>
  );
}

export default SocialLoginPage;
