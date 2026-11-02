'use strict';

const fs = require('fs');
const path = require('path');

let cachedGuide = null;

function loadMyZubsterGuide() {
  if (cachedGuide) return cachedGuide;
  try {
    const guidePath = path.join(process.cwd(), 'agents', 'zorgax', 'MYZUBSTER_GUIDE.md');
    cachedGuide = fs.readFileSync(guidePath, 'utf8');
    return cachedGuide;
  } catch (_err) {
    return 'MyZubster: Ecosistema open-source collaborativo con Marketplace (/marketplace), Metaverso (/metaverse), e contributi GitHub.';
  }
}

const CANONICAL_TOPICS = {
  WHAT_IS_MYZUBSTER: {
    patterns: [
      /\b(che\s+)?cos['’]?è\s+myzubster\b/i,
      /\bspiegami\s+myzubster\b/i,
      /\bwhat\s+is\s+myzubster\b/i,
      /\babout\s+myzubster\b/i
    ],
    answer: `Zorgax: **MyZubster** è un ecosistema digitale open-source e collaborativo nato per unire persone, progetti reali e sostenibilità.

I percorsi live principali sono:
• **Marketplace** (\`/marketplace\`): esplora annunci, richiedi beni o servizi ed effettua scambi diretti o gratuiti tra utenti.
• **Metaverso 3D** (\`/metaverse\`): ambienti virtuali 3D navigabili da browser per esplorazione e community.
• **Progetti Pilota LIFE** (\`/life-pilot\`): iniziative territoriali per la cura del verde e l'economia circolare.
• **Fumetti e Creatività**: l'universo narrativo originale di Daniel Ioni che racconta le avventure di Zorgax.
• **Community Open Source**: codice e documentazione interamente aperti su GitHub per collaborare insieme.

*Nota di trasparenza*: MyZubster è in anteprima attiva (MVP). Le funzioni di base sono operative, mentre pagamenti crypto automatici ed escrow sono in sviluppo e non attivi.`
  },

  CAN_I_SELL: {
    patterns: [
      /\bposso\s+vendere\b/i,
      /\bcome\s+(posso\s+)?vend(?:ere|o)\b/i,
      /\bcome\s+(divento|diventare)\s+(un\s+)?(seller|venditore)\b/i,
      /\bapri(?:re)?\s+(uno\s+)?spazio\s+seller\b/i,
      /\bcan\s+i\s+sell\b/i,
      /\bhow\s+to\s+become\s+a\s+seller\b/i
    ],
    answer: `Zorgax: **Sì, chiunque può attivare gratuitamente il proprio spazio Seller su MyZubster.**

Ecco i passi per iniziare:
1. Vai su **/marketplace** e premi **"Diventa Seller · Gratis"**.
2. Se non hai effettuato l'accesso, verrai indirizzato su **/social-login** per accedere rapidamente con Google o GitHub, per poi tornare al Marketplace.
3. Attivato il profilo Seller, premi **"Pubblica annuncio"** per inserire prodotti fisici, servizi, consulenze o progetti.
4. Puoi impostare un prezzo in EUR, scegliere la modalità gratuita (omaggio) o il baratto.

*Importante*: in anteprima, gli accordi economici e la consegna avvengono direttamente tra acquirente e venditore. Non sono attivi checkout o escrow automatici.`
  },

  HOW_TO_CONTACT_SELLER: {
    patterns: [
      /\bcome\s+contatto\s+(un\s+)?venditore\b/i,
      /\bcome\s+richied(?:o|ere)\s+(un\s+)?annuncio\b/i,
      /\bcome\s+ordinare\b/i,
      /\bcome\s+funziona\s+la\s+chat\s+ordini\b/i,
      /\bhow\s+(do\s+i\s+)?contact\s+(a\s+)?seller\b/i
    ],
    answer: `Zorgax: **Per contattare un venditore o richiedere un annuncio**:

1. Su **/marketplace**, apri la scheda dell'annuncio desiderato e clicca su **"Richiedi"**.
2. Se non sei autenticato, verrai indirizzato su **/social-login** e poi reindirizzato all'annuncio.
3. Specifica la quantità e un messaggio iniziale per il venditore, quindi conferma l'invio.
4. Apri la sezione **"Le mie richieste"** nella barra del Marketplace:
   • Lo stato iniziale sarà **⏳ In attesa di approvazione**.
   • Quando il venditore accetta (**🤝 Richiesta accettata**), potrai aprire la **chat privata** dedicata all'ordine.
   • Tramite la chat potrete accordarvi su luogo, data e orario per lo scambio a mano o la consegna.
   • Il badge a campana (\`🔔\`) ti segnalerà l'arrivo di nuovi messaggi non letti.`
  },

  WHAT_IS_METAVERSE: {
    patterns: [
      /\b(che\s+)?cos['’]?è\s+il\s+metaverso\b/i,
      /\bcome\s+funziona\s+il\s+metaverso\b/i,
      /\bwhat\s+is\s+(the\s+)?metaverse\b/i,
      /\bmetaverse\s+rooms?\b/i
    ],
    answer: `Zorgax: **Il Metaverso di MyZubster** è uno spazio virtuale 3D interattivo accessibile direttamente dal browser su **/metaverse**, senza necessità di visori VR o download esterni.

Cosa puoi fare attualmente:
• Esplorare stanze tematiche e ambienti virtuali 3D in tempo reale.
• Incontrare altri membri della community e partecipare a momenti di ritrovo virtuali.
• Scoprire installazioni artistiche e progetti collaborativi.

*Trasparenza*: stand commerciali automatizzati e vendite dirette nel metaverso sono concetti in sperimentazione pilota, non attivi per transazioni commerciali in produzione.`
  },

  HOW_TO_CONTRIBUTE_GITHUB: {
    patterns: [
      /\bcome\s+contribuisco\s+(su\s+)?github\b/i,
      /\bcome\s+(posso\s+)?contribuire\b/i,
      /\bcome\s+faccio\s+una\s+pr\b/i,
      /\bhow\s+to\s+contribute\s+(on\s+)?github\b/i,
      /\bcontributor\s+guide\b/i
    ],
    answer: `Zorgax: **Contribuire a MyZubster come sviluppatore o documentatore è aperto a tutti su GitHub.**

Il repository ufficiale è: **https://github.com/MyZubster-Ecosystem/myzubster**

Ecco il percorso per iniziare:
1. **Scegli un'Issue**: Consulta la lista issue per trovare task su frontend (React), backend (Node.js/Express), UX, QA o intelligenza Zorgax.
2. **Fork & Branch**: Esegui il fork del repository e crea un branch locale per la tua modifica (es. \`feat/nome-funzione\` o \`fix/issue-id\`).
3. **Verifica Locale**:
   • Backend: \`npm test\` (oltre 220 suite Jest con MongoDB in memoria).
   • Frontend: \`npm --prefix frontend test\` e verifica build con \`npm --prefix frontend run build\`.
4. **Pull Request**: Apri una PR verso il repository con descrizione puntuale, evidenze di test e riferimento all'issue risolta (\`Closes #...\`).

Il percorso tecnico su GitHub è separato dall'esperienza d'uso per cittadini e venditori, permettendo a chiunque di migliorare la piattaforma con standard di qualità elevati.`
  }
};

function matchCanonicalQuestion(query) {
  const text = String(query || '').trim();
  if (!text) return null;

  for (const [key, config] of Object.entries(CANONICAL_TOPICS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        return {
          topic: key,
          answer: config.answer
        };
      }
    }
  }

  return null;
}

module.exports = {
  loadMyZubsterGuide,
  matchCanonicalQuestion,
  CANONICAL_TOPICS
};
