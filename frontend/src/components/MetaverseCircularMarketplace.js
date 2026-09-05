import React from 'react';
import { METAVERSE_EVENTS, trackMetaverseEvent } from '../analytics/metaverseAnalytics';

const BOOTHS = [
  {
    id: 'sound-system',
    icon: '🔊',
    title: 'Sound System Equipment',
    description: 'Trova seller di diffusori, amplificazione e attrezzatura audio nel Marketplace.',
    href: '/marketplace?category=sound-system',
    action: 'Cerca impianti'
  },
  {
    id: 'food',
    icon: '🍐',
    title: 'Food & Local Producers',
    description: 'Scopri produttori e seller di alimenti, come frutta e prodotti locali.',
    href: '/marketplace?category=food',
    action: 'Trova produttori'
  },
  {
    id: 'hygiene',
    icon: '🧷',
    title: 'Hygiene & Daily Goods',
    description: 'Prodotti quotidiani e per l’igiene disponibili da seller verificabili. Nessun marchio è presentato come partner senza autorizzazione.',
    href: '/marketplace?category=hygiene',
    action: 'Cerca prodotti'
  },
  {
    id: 'reuse',
    icon: '🛠️',
    title: 'Repair & Reuse',
    description: 'Ripara, riusa o rimetti in circolo prodotti prima che diventino rifiuti.',
    href: '/marketplace?category=repair-reuse',
    action: 'Trova servizi'
  },
  {
    id: 'recycling',
    icon: '♻️',
    title: 'Recycling & Recovery',
    description: 'Trova operatori di raccolta, riciclo e recupero con informazioni di provenienza e verifica.',
    href: '/marketplace?category=recycling',
    action: 'Trova riciclo'
  }
];

function MetaverseCircularMarketplace() {
  const openBooth = (booth) => {
    trackMetaverseEvent(METAVERSE_EVENTS.MARKETPLACE_OPEN, {
      source: 'metaverse-circular-marketplace',
      destination: booth.href,
      booth: booth.id,
      surface: 'circular-booth'
    });
  };

  return (
    <section className="metaverse-panel metaverse-circular-marketplace">
      <div className="metaverse-kicker">CIRCULAR MARKETPLACE WORLD</div>
      <h3>Dal prodotto al recupero</h3>
      <p className="metaverse-muted">
        Esplora seller e servizi collegati al Marketplace: acquista, usa, ripara e trova il percorso di riciclo. Zorgax ti aiuta a muoverti tra le tappe.
      </p>
      <div className="metaverse-portal-list">
        {BOOTHS.map((booth) => (
          <a href={booth.href} key={booth.id} onClick={() => openBooth(booth)}>
            <span>{booth.icon}</span>
            <div>
              <strong>{booth.title}</strong>
              <small>{booth.description}</small>
              <small>{booth.action} →</small>
            </div>
          </a>
        ))}
      </div>
      <small className="metaverse-muted">
        I booth mostrano categorie e listing del Marketplace. La presenza di un marchio o prodotto non implica partnership o endorsement; gli operatori di riciclo devono essere rappresentati con evidenze verificabili.
      </small>
    </section>
  );
}

export default MetaverseCircularMarketplace;
