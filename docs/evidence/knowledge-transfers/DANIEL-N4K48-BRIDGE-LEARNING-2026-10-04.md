# Daniel × N4K48 — Dal software indipendente ai sistemi distribuiti

**Proposta per il sito Conoscenze MyZubster · 4 ottobre 2026**

- Contributore di conoscenza: Daniel Ioni / H4X0R
- Collaboratore e destinatario proposto: Nicola / N4K48
- Stato: PROPOSTA IN REVISIONE
- Conferma di Nicola sull'apprendimento: IN ATTESA
- Test remoto autenticato VPS–PC di Nicola: IN ATTESA
- Attestazione blockchain per questa nuova scheda: NON CREATA

## Conoscenze condivise da Daniel

1. **Indipendenza e architettura:** distinzione fra software autonomo, pilota distribuito con broker e rete pienamente decentralizzata.
2. **Comunicazione sicura:** connessioni HTTPS in uscita dal computer del partecipante, autorizzazione e operazioni limitate di lettura del catalogo.
3. **Infrastruttura:** Docker, reverse proxy Nginx, pubblicazione su loopback, aggiornamenti controllati e health check.
4. **Sicurezza e correttezza:** credenziali distinte, rotazione, assegnazioni temporanee, lease_id, rifiuto di risultati scaduti o ripetuti e limitazione delle richieste.
5. **Provenienza della conoscenza:** commit, test, hash, fonti e revisione umana; integrità crittografica e competenza certificata restano concetti distinti.
6. **Creatività documentata:** rapporto fra fumetto N4K48, percorso tecnico e provenienza delle opere; NFT_CANDIDATE non significa NFT mintato.
7. **Direzioni future:** standard aperti, identità per nodo, federazione e sperimentazione eventuale con Tor; nessuna prova attuale di trasporto del Bridge via Tor.

**Collaborazione bidirezionale:** Nicola sviluppa autonomamente il proprio MVP, la ricerca evidence-first con Qdrant/Ollama e Nicola Comics. Questa proposta non attribuisce a Daniel il codice di Nicola e non dichiara come apprese competenze che Nicola non abbia confermato.

## Evidenze disponibili al 4 ottobre 2026

- Bridge aggiornato sulla VPS dal checkpoint locale b1b38c151548ea18e88dc8f7e3a2efd31e038692; il repository autonomo del Bridge e le sue prove vanno ancora resi pubblici e revisionati.
- Sette test automatici a livello sorgente superati; collaudo Docker isolato con agent e catalogo simulato superato.
- Container di produzione healthy, riavvii rilevati: zero dopo il rilascio controllato.
- API: health locale HTTP 200; /node/next pubblico senza token HTTP 401 e autenticato HTTP 200; amministrazione pubblica HTTP 403.
- Agent aggiornato: SHA-256 79ae718b1b9aad714fe7521e77bd2b5c9c3c2ff0ce248f0d7b03b3db67f5ea34; verifica indipendente del file estratto effettuata su Windows.
- Nuove credenziali distribuite al broker e accettate; vecchia credenziale del nodo revocata.
- Regole Nginx di rate limiting caricate; test controllato della soglia HTTP 429 non ancora documentato.
- Nicola ha pubblicato separatamente il proprio MVP e prove di test locali; non equivalgono al test remoto VPS–PC.

## Cosa manca

- Conferma esplicita di Nicola sulle conoscenze effettivamente acquisite.
- Pubblicazione e revisione del repository autonomo Node Bridge e delle prove riproducibili.
- Scambio autenticato end-to-end tra VPS e computer di Nicola; successive prove di disconnessione, ripristino e revoca.

## Fonti

- [Software indipendente di Nicola](https://github.com/nicolaususnicola-lgtm/myzubster-mvp)
- [Prove locali del nodo N4K48](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/pilot-tests/N4K48-PILOT-NODE-EVIDENCE.md)
- [Serie illustrata N4K48](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/tree/main/docs/n4k48-comics)
- [Manifest di provenienza dei fumetti](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/comics.manifest.json)
- [Articolo tecnico DEV.to](https://dev.to/danielioni/beyond-the-platform-building-myzubster-with-local-ai-independent-nodes-comics-and-verifiable-kcm)
- [Attestazione precedente e distinta (18 settembre)](./KNOWLEDGE-N4K48-2026-09-18-001.md)

## Collegamento al sito Conoscenze

Daniel può creare e pubblicare una Knowledge Card a proprio nome nel [Profile Builder](https://www.myzubster.com/zorgax-profile-builder), usando questa fonte dopo la revisione. Nicola deve creare o confermare autonomamente la propria scheda. La relazione fra le due schede va proposta nella [sezione Collega conoscenze](https://www.myzubster.com/knowledge-links) e diventa pubblica soltanto dopo l'approvazione di entrambi.

Questa proposta è una nuova evidenza editoriale. La precedente attestazione Base Sepolia del 18 settembre riguarda un altro snapshot e non prova automaticamente questo trasferimento, l'apprendimento individuale, i diritti d'autore o il collegamento remoto ancora in attesa.