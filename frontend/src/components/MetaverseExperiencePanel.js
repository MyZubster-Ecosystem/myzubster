import React, { useMemo } from 'react';
import { METAVERSE_EVENTS, trackMetaverseEvent } from '../analytics/metaverseAnalytics';
import { conversionContext, trackConversion } from '../analytics/conversionAnalytics';
import MetaverseCircularMarketplace from './MetaverseCircularMarketplace';

const PORTALS = [
  { href: '/space-station', label: 'Space Station', icon: '🛰️', description: 'Ambiente sperimentale, simulazioni e collaborazione evidence-first.', event: METAVERSE_EVENTS.SPACE_STATION_OPEN },
  { href: '/life-pilot', label: 'Missioni / Progetti LIFE', icon: '🌱', description: 'Missioni, pilot ambientali, evidenze e KPI/MRV.', event: METAVERSE_EVENTS.MISSIONS_OPEN },
  { href: '/marketplace', label: 'Marketplace', icon: '🛒', description: 'Annunci, Seller e scambi della community.', event: METAVERSE_EVENTS.MARKETPLACE_OPEN },
  { href: 'https://github.com/MyZubster-Ecosystem/myzubster/blob/main/CONTRIBUTING.md', label: 'Contribuisci', icon: '🧑‍💻', description: 'Documentazione GitHub per iniziare a contribuire.', event: METAVERSE_EVENTS.CONTRIBUTION_DOCS_OPEN, external: true },
  { href: '/social-login', label: 'Identità', icon: '🪪', description: 'Collega un account e il personaggio verificato.' },
  { href: '/zorgax', label: 'Zorgax', icon: '👁️', description: 'Guida narrativa e intelligenza del mondo.' }
];

function storageAvailable() {
  try { const key = '__myz_metaverse_check__'; localStorage.setItem(key, '1'); localStorage.removeItem(key); return true; } catch (_error) { return false; }
}

function SystemCheck() {
  const checks = useMemo(() => [
    { label: 'JavaScript', ok: true },
    { label: 'Fetch API', ok: typeof window.fetch === 'function' },
    { label: 'Storage locale', ok: storageAvailable() },
    { label: 'CSS Grid', ok: Boolean(window.CSS?.supports?.('display', 'grid')) },
    { label: 'Connessione', ok: navigator.onLine }
  ], []);
  const ready = checks.every((check) => check.ok);
  return <section className="metaverse-panel"><h3>Requisiti e controllo sistema</h3><div className={`metaverse-readiness ${ready ? 'is-ready' : 'needs-attention'}`}>{ready ? 'Browser pronto per Neon Plaza' : 'Alcune funzionalità potrebbero essere limitate'}</div><ul className="metaverse-check-list">{checks.map((check) => <li key={check.label}><span>{check.ok ? '✅' : '⚠️'}</span>{check.label}</li>)}</ul><details className="metaverse-requirements"><summary>Specifiche minime consigliate</summary><p>Browser moderno aggiornato, JavaScript attivo, almeno 2 GB di RAM, schermo da 320 px e connessione stabile da 2 Mbps.</p><p>Non sono richiesti GPU dedicata, visore VR o wallet. Per un’esperienza migliore: 4 GB di RAM e connessione da 5 Mbps.</p></details></section>;
}

function FirstMission({ identityStatus, visitedLandmarks }) {
  const complete = visitedLandmarks.length > 0;
  const linked = identityStatus === 'account-linked' || identityStatus === 'verified';
  return (
    <section className="metaverse-panel" aria-live="polite">
      <div className="metaverse-kicker">ZORGAX · PRIMA MISSIONE</div>
      <h3>{complete ? 'Missione completata ✨' : 'Raggiungi il primo portale'}</h3>
      <p className="metaverse-muted">
        {complete
          ? 'Hai esplorato Neon Plaza. Le zone visitate restano disponibili in questo browser; puoi anche collegare il personaggio a un account.'
          : 'Muovi il personaggio con le frecce o WASD e raggiungi uno dei portali luminosi.'}
      </p>
      <div className="metaverse-progress" aria-label={complete ? 'Missione completata' : 'Missione in corso'}>
        <span style={{ width: complete ? '100%' : '15%' }} />
      </div>
      {complete && !linked && (
        <div>
          <ul className="metaverse-check-list">
            <li><span>💾</span>Conserva il personaggio oltre la sessione ospite</li>
            <li><span>🪪</span>Pubblica il nome del personaggio scelto</li>
            <li><span>🌱</span>Collega contributi e pilot autorizzati</li>
          </ul>
          <a
            className="metaverse-primary"
            href="/social-login?returnTo=%2Fmetaverse"
            onClick={() => {
              const context = conversionContext({ placement: 'metaverse_first_mission', action: 'verify_character' });
              trackConversion('character_verification_started', context);
              trackConversion('signup_start', context);
            }}
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 12 }}
          >
            Verifica il tuo personaggio
          </a>
          <small className="metaverse-muted">
            Accedendo autorizzi il collegamento del personaggio al tuo account. La pubblicazione di altre informazioni richiede un consenso separato. Non è una verifica legale dell’identità.
          </small>
        </div>
      )}
      {complete && linked && (
        <div>
          <strong>✅ Personaggio collegato al tuo account</strong>
          <small className="metaverse-muted">Le zone visitate vengono conservate sul profilo collegato all’account. Il collegamento conserva l’identità pubblica del personaggio, ma non certifica identità legale o competenze.</small>
        </div>
      )}
    </section>
  );
}

function DiscoverableRooms({ rooms }) {
  return (
    <section className="metaverse-panel">
      <div className="metaverse-kicker">SPAZI SPERIMENTALI</div>
      <h3>Stanze del mondo</h3>
      {rooms.length === 0 ? (
        <p className="metaverse-muted">Nessuna stanza pubblicata o attiva in questo momento.</p>
      ) : (
        <div className="metaverse-portal-list">
          {rooms.map((room) => (
            <article className="metaverse-nearby" key={room.id}>
              <span>{room.state === 'live' ? '🔴' : '🏛️'}</span>
              <div>
                <strong>{room.name}</strong>
                <small>{room.state === 'live' ? 'Live' : room.state} · capacità {room.capacity}</small>
              </div>
            </article>
          ))}
        </div>
      )}
      <small className="metaverse-muted">Funzione sperimentale: visibilità e accesso sono applicati dal server.</small>
    </section>
  );
}

function MetaverseExperiencePanel({ identityStatus, online, nearby, messages, sessionId, visitedLandmarks, rooms = [] }) {
  const myMessages = messages.filter((message) => message.sessionId === sessionId).length;
  const badges = [
    { id: 'arrival', label: 'Primo ingresso', icon: '🚀', unlocked: true },
    { id: 'explorer', label: 'Esploratore', icon: '🧭', unlocked: visitedLandmarks.length >= 2 },
    { id: 'social', label: 'Incontro', icon: '🤝', unlocked: nearby > 0 },
    { id: 'voice', label: 'Prima voce', icon: '💬', unlocked: myMessages > 0 },
    { id: 'verified', label: 'Identità collegata', icon: '✅', unlocked: identityStatus === 'account-linked' }
  ];
  const trackPortal = (portal) => { if (portal.event) trackMetaverseEvent(portal.event, { source: 'neon-plaza', destination: portal.href, surface: 'metaverse-portal-list' }); };
  return <><section className="metaverse-panel"><h3>Dashboard sessione</h3><div className="metaverse-stat-grid"><div><strong>{online}</strong><small>online</small></div><div><strong>{nearby}</strong><small>vicini</small></div><div><strong>{myMessages}</strong><small>messaggi</small></div><div><strong>{visitedLandmarks.length}</strong><small>zone visitate</small></div></div><div className="metaverse-progress" aria-label={`${visitedLandmarks.length} zone visitate`}><span style={{ width: `${Math.min(100, visitedLandmarks.length * 20)}%` }} /></div><div className="metaverse-achievements">{badges.map((badge) => <span key={badge.id} className={badge.unlocked ? 'is-unlocked' : 'is-locked'} title={badge.unlocked ? 'Sbloccato in questa esperienza' : 'Non ancora sbloccato'}>{badge.icon} {badge.label}</span>)}</div><small className="metaverse-muted">Questi sono progressi di esperienza, non attestazioni professionali o ricompense finanziarie.</small></section><FirstMission identityStatus={identityStatus} visitedLandmarks={visitedLandmarks} /><DiscoverableRooms rooms={rooms} /><MetaverseCircularMarketplace /><section className="metaverse-panel"><h3>Portali MyZubster</h3><div className="metaverse-portal-list">{PORTALS.map((portal) => <a href={portal.href} key={portal.label} onClick={() => trackPortal(portal)} target={portal.external ? '_blank' : undefined} rel={portal.external ? 'noreferrer' : undefined}><span>{portal.icon}</span><div><strong>{portal.label}</strong><small>{portal.description}</small></div></a>)}</div></section><SystemCheck /></>;
}

export default MetaverseExperiencePanel;
