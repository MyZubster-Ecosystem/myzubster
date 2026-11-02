# MyZubster Knowledge Base & Guida ai Percorsi (v2.1 - 2026)

Documento versionato e verificato sulle funzionalità reali, percorsi utente e stato dello sviluppo dell'ecosistema MyZubster.

---

## 1. Che cos'è MyZubster?

**MyZubster** è un ecosistema digitale open-source e collaborativo, nato per connettere persone, competenze, progetti reali ed economie circolari.

L'ecosistema unisce:
1. **Marketplace Comunitario** (`/marketplace`): spazio per pubblicare offerte, richiedere servizi, scambiare beni (in euro, baratto o gratuiti) e interagire via chat privata.
2. **Metaverso 3D** (`/metaverse`): ambienti virtuali interattivi esplorabili via browser per incontri e attività di community.
3. **Progetti Pilota LIFE & Territorio** (`/life-pilot`): sperimentazione di economia circolare, cura del verde e know-how pratico (es. kefir, orto).
4. **Fumetti e Creatività** (`/fumetti`): universo narrativo originale ideato da Daniel Ioni che introduce Zorgax e i personaggi della saga.
5. **Comunità Open Source** (`GitHub`): codice e documentazione interamente aperti per contribuire e migliorare la piattaforma insieme.

> **Stato di sviluppo**: MyZubster è in fase MVP / Anteprima attiva. Le funzionalità essenziali di navigazione, marketplace, chat e metaverso sono operative, mentre moduli avanzati di pagamento automatico ed escrow sono in fase di sviluppo.

---

## 2. Percorso Utente Non Tecnico (Cittadini, Venditori, Appassionati)

### A. «Posso vendere?»
**Sì, chiunque può attivare gratuitamente il proprio spazio Seller.**
- **Come iniziare**: Vai su `/marketplace` e clicca su **"Diventa Seller · Gratis"**.
- **Autenticazione**: Se non sei autenticato, verrai guidato su `/social-login` (accesso rapido con Google o GitHub) e poi reindirizzato al Marketplace.
- **Pubblicazione annunci**: Puoi pubblicare annunci per prodotti fisici, consulenze, servizi o progetti con prezzo in EUR, modalità gratuita (omaggio) o baratto.
- **Trasparenza pagamenti**: In anteprima, gli accordi economici e lo scambio avvengono direttamente tra gli utenti. Non sono attivi checkout ed escrow automatici basati su criptovalute.

### B. «Come contatto un venditore o richiedo un annuncio?»
1. **Esplora gli annunci**: Su `/marketplace`, seleziona una categoria o filtra per località.
2. **Invia la richiesta**: Clicca su **"Richiedi"** sull'annuncio desiderato, indica la quantità e scrivi un messaggio opzionale per il venditore.
3. **Gestisci la conversazione**:
   - Apri **"Le mie richieste"** (o l'icona ordini nella testata).
   - Quando il venditore accetta l'ordine (stato `🤝 Accettata`), si attiva la **chat privata integrata**.
   - Usa la chat per concordare in sicurezza luogo, data e orario per lo scambio a mano o la consegna.
   - Le notifiche di messaggi non letti (`🔔`) ti avvisano in tempo reale dei nuovi messaggi.

### C. «Cos'è il Metaverso?»
- È uno spazio virtuale 3D accessibile direttamente dal browser su `/metaverse`, senza visori obbligatori o installazioni pesanti.
- Permette di esplorare ambienti grafici, incontrare altri membri della community e partecipare a eventi o dimostrazioni interattive.
- *(Nota di trasparenza: gli stand commerciali automatizzati nel metaverso sono ancora in fase pilota e non abilitati per le vendite in produzione).*

### D. «Cosa sono i fumetti e i progetti pilota?»
- **Fumetti**: Narrativa originale che racconta le avventure dell'alieno Zorgax, Daniel e gli amici della community, accessibile dai percorsi culturali.
- **LIFE Pilot (`/life-pilot`)**: Progetti di sostenibilità urbana e benessere, come la coltivazione biologica e la diffusione della cultura dei fermentati (kefir d'acqua e di latte).

---

## 3. Percorso Contributore Tecnico (Sviluppatori, Tester, Documentatori)

### «Come contribuisco su GitHub?»
Il repository ufficiale è ospitato su GitHub:  
👉 **`https://github.com/MyZubster-Ecosystem/myzubster`**

I passi per contribuire:
1. **Esplora le Issue**: Controlla le issue aperte (etichettate come frontend, backend, UX, QA o Zorgax).
2. **Fork & Clone**: Fai un fork personale del repository e clona il branch di lavoro.
3. **Ambiente locale**:
   - Backend: Node.js 22 LTS, MongoDB locale o in-memory.
   - Frontend: React 18, Tailwind / styled CSS.
   - Esegui i test prima di iniziare: `npm test` (backend) e `npm --prefix frontend test` (frontend).
4. **Crea un Branch tematico**: e.g., `feat/nome-funzionalita` o `fix/numero-issue`.
5. **Test & Qualità**: Aggiungi test automatizzati per ogni modifica e verifica con `CI=true npm test` e `CI=true npm run build`.
6. **Apri una Pull Request (PR)**: Descrivi chiaramente il problema risolto, collega l'issue (`Closes #1234`) e attendi la revisione del team di manutenzione.

---

## 4. Matrice di Stato delle Funzionalità (Verificato vs Non Abilitato)

| Funzionalità | Stato Reale | Dettagli di Funzionamento |
|---|---|---|
| **Navigazione & Vetrina Annunci** | 🟢 **LIVE** | 4 schede di azione su homepage, categorie annunci su `/marketplace`. |
| **Richieste & Ordini Marketplace** | 🟢 **LIVE** | Flusso Richiedi, viste compratore/venditore, badge di stato, conferma azioni. |
| **Chat Ordini & Notifiche Unread** | 🟢 **LIVE** | Chat privata bidirezionale, endpoint conteggio non letti, isolamento IDOR. |
| **Attivazione Seller Gratuita** | 🟢 **LIVE** | Attivazione piano gratuito e pubblicazione annunci fino a 20 listing. |
| **Metaverso 3D Browser** | 🟢 **LIVE** | Stanze virtuali WebGL esplorabili su `/metaverse`. |
| **Login Google & GitHub** | 🟢 **LIVE** | Accesso OAuth su `/social-login` con redirect automatico `returnTo`. |
| **Progetto Pilota LIFE / Orto** | 🟡 **PILOT** | Percorso sperimentale su `/life-pilot` per progetti ecologici di Nicola. |
| **Escrow & Checkout Crypto Automatico** | 🔴 **NON ABILITATO** | Smart contract e pagamenti automatici non verificati in preview; solo accordi diretti. |
| **Mercato NFT Speculativo** | 🔴 **NON ABILITATO** | Nessun trading speculativo garantito o vendita NFT su rete principale. |
| **Guadagni o Rendite Garantite** | 🔴 **NESSUNA PROMESSA** | MYZ è un registro interno di accounting/merito, non valuta a corso legale o investimento. |
