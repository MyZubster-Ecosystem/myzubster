# Zorgax — the MyZubster Copilot

> **Non sai da dove iniziare con MyZubster? Chiedi a Zorgax.**

Zorgax è il copilota conversazionale di MyZubster. Il suo scopo è rendere un ecosistema ampio comprensibile anche a chi arriva per la prima volta: l'utente descrive con parole normali ciò che vuole capire o fare, Zorgax risponde e, quando riconosce un obiettivo supportato, propone il percorso più utile.

## In 30 secondi

```text
UTENTE
  ↓
"Cosa posso fare su MyZubster?"
  ↓
ZORGAX CHAT
  ↓
SPIEGA IL CONTESTO
  ↓
RICONOSCE L'INTENTO
  ↓
PROPONE IL PROSSIMO PASSO
  ├─ Marketplace
  ├─ Seller
  ├─ Metaverso
  ├─ LIFE Pilot
  └─ Community / login
  ↓
UTENTE DECIDE E PROSEGUE
```

Zorgax non è quindi soltanto un chatbot: è un livello di orientamento tra la persona e le diverse aree di MyZubster.

## Cosa può chiedere un nuovo utente

Esempi:

- `Cos'è MyZubster?`
- `Cosa posso fare qui?`
- `Come posso diventare Seller?`
- `Come funziona il Marketplace?`
- `Fammi esplorare il Metaverso.`
- `Cos'è LIFE Pilot?`
- `Come entro nella community?`

Il popup pubblico usa la chat Zorgax e mantiene un breve contesto della conversazione. Quando il testo indica un percorso noto, il copilota può mostrare anche un'azione contestuale con cui raggiungere direttamente la sezione corretta.

## Come Zorgax aiuta a capire MyZubster

MyZubster collega più esperienze e workflow. Zorgax le presenta come percorsi comprensibili invece di costringere l'utente a conoscere in anticipo l'architettura del progetto.

| Se vuoi… | Zorgax può orientarti verso… |
|---|---|
| capire il progetto | introduzione e documentazione MyZubster |
| scoprire prodotti e servizi | Marketplace |
| pubblicare una proposta | percorso Seller |
| esplorare il mondo digitale | Metaverso |
| capire i pilot ambientali | LIFE Pilot |
| partecipare | community / login |
| contribuire tecnicamente | repository, issue, missioni e documentazione |

## Il modello MyZubster dietro Zorgax

Per i workflow evidence-first, il modello generale rimane:

```text
OBSERVE
  ↓
DOCUMENT
  ↓
CONNECT
  ↓
COLLABORATE
  ↓
VERIFY
  ↓
PUBLISH
  ↓
REWARD / OPTIONAL EXTERNAL SETTLEMENT
```

Zorgax può spiegare, orientare, classificare input e assistere workflow autorizzati. Non trasforma però automaticamente una proposta in un fatto verificato.

## Chat e Copilot

La UI pubblica invia le domande all'endpoint Zorgax Assistant del backend. Il frontend non contiene le chiavi dei provider. La chat pubblica di base usa `useWeb: false`: l'accesso a funzioni di ricerca esterna resta separato e soggetto alle policy di accesso del backend.

Il Copilot riconosce attualmente intenti relativi a Seller, Marketplace, Metaverso, LIFE e accesso alla community e può presentare un'azione contestuale. Gli eventi principali della chat e delle azioni vengono inviati al sistema di conversion analytics per capire se Zorgax aiuta realmente gli utenti a orientarsi.

## Confini importanti

Zorgax **assiste, non certifica**.

- una risposta AI non è prova scientifica, legale, finanziaria o operativa;
- Zorgax non deve inventare misurazioni o evidenze mancanti;
- non deve pubblicare dati riservati o non autorizzati;
- non sostituisce review umane richieste;
- non autorizza automaticamente merge, spese, partnership, governance o settlement;
- un suggerimento di navigazione non implica che la funzionalità di destinazione sia validata per ogni possibile uso;
- lo stato di MyZubster resta **MVP / active development and validation**: alcune parti sono operative, altre sperimentali o in evoluzione.

## Per sviluppatori

Componenti principali:

- frontend/copilot: `frontend/src/App.js` (`ZorgaxAssistant` e `COPILOT_ACTIONS`);
- API mount: `/api/zorgax/assistant`;
- chat: `POST /api/zorgax/assistant/chat`;
- status: `GET /api/zorgax/assistant/status`;
- route implementation: `src/routes/zorgaxAssistantRoutes.js`;
- agent policy/context: `agents/zorgax/SYSTEM_PROMPT.md`;
- GitHub automation: `docs/ZORGAX_GITHUB_AUTOMATION.md`.

## Idea centrale

```text
MYZUBSTER = ECOSISTEMA
ZORGAX = INTERFACCIA CONVERSAZIONALE + COPILOTA
UTENTE = DECIDE COSA FARE
EVIDENZA + REVIEW = DETERMINANO COSA È VERIFICATO
```

In breve: **Zorgax rende MyZubster più facile da capire e attraversare, senza eliminare i confini di sicurezza, evidenza e responsabilità umana del progetto.**
