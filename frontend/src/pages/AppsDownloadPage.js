import React from 'react';

const JOBS_RELEASE = 'https://github.com/MyZubster-Ecosystem/MyZubster-App/releases/tag/lavori-beta-v1';
const JOBS_APK = 'https://github.com/MyZubster-Ecosystem/MyZubster-App/releases/download/lavori-beta-v1/app-debug.apk';
const TV_RELEASE = 'https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001';
const TV_APK = 'https://github.com/MyZubster-Ecosystem/myzubster/releases/download/google-tv-debug-001/app-debug.apk';

const shell = { minHeight: '100vh', background: '#071018', color: '#f8fafc', padding: '32px 16px 60px' };
const card = { background: '#0f1b27', border: '1px solid #213547', borderRadius: 18, padding: 22 };
const button = { display: 'inline-block', textDecoration: 'none', padding: '12px 16px', borderRadius: 11, background: '#0ea5e9', color: '#fff', fontWeight: 800, marginRight: 10, marginTop: 8 };
const secondary = { ...button, background: '#182938', border: '1px solid #334155' };

export default function AppsDownloadPage() {
  return <div style={shell}>
    <main style={{ maxWidth: 980, margin: '0 auto' }}>
      <a href="/" style={{ ...secondary, marginBottom: 18 }}>← MyZubster Home</a>
      <div style={{ color: '#67e8f9', fontWeight: 900, letterSpacing: 1, marginTop: 18 }}>MYZUBSTER · TEST BUILDS</div>
      <h1 style={{ fontSize: 'clamp(34px,6vw,58px)', margin: '10px 0' }}>Scarica le app MyZubster</h1>
      <p style={{ color: '#b6c5d1', fontSize: 18, lineHeight: 1.6 }}>Build Android pubbliche per test. Verifica versione e checksum prima dell’installazione. Questi pacchetti non sono release Play Store di produzione.</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginTop: 24 }}>
        <article style={card}>
          <div style={{ fontSize: 36 }}>🧰</div>
          <h2>MyZubster Lavori Beta v1</h2>
          <p style={{ color: '#a8bac7', lineHeight: 1.55 }}>Beta Android dell’area Lavori/Bounty, con ricerca, filtri, reward e candidatura locale di test.</p>
          <p><strong>Tag:</strong> lavori-beta-v1</p>
          <a href={JOBS_APK} style={button}>Scarica APK</a>
          <a href={JOBS_RELEASE} target="_blank" rel="noreferrer" style={secondary}>Release + note</a>
        </article>

        <article style={card}>
          <div style={{ fontSize: 36 }}>📺</div>
          <h2>MyZubster TV · Debug 001</h2>
          <p style={{ color: '#a8bac7', lineHeight: 1.55 }}>Build di test per Android TV / Google TV. Richiede ancora QA reale su launcher, D-pad, layout e rete.</p>
          <p><strong>Tag:</strong> google-tv-debug-001</p>
          <p style={{ color: '#93c5fd', wordBreak: 'break-all' }}><strong>SHA-256:</strong> f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704</p>
          <a href={TV_APK} style={button}>Scarica APK TV</a>
          <a href={TV_RELEASE} target="_blank" rel="noreferrer" style={secondary}>Release + guida</a>
        </article>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <strong>⚠️ Build di test</strong>
        <p style={{ color: '#a8bac7', marginBottom: 0, lineHeight: 1.55 }}>Installa solo sui dispositivi destinati al test. Per MyZubster TV la release documentata è una debug build e non una build firmata di produzione.</p>
      </section>
    </main>
  </div>;
}
