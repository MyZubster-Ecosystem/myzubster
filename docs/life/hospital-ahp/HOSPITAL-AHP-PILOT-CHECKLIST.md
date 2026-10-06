# Hospital AHP Pilot Checklist

Status: `PROPOSED PILOT / READY FOR VALIDATION`

## 1. Struttura / ospedale
- [ ] Identificare il flusso AHP/PAP incluso nel pilot
- [ ] Confermare dove avviene la pesatura pre-trasporto
- [ ] Identificare la pesa o il sistema di misura
- [ ] Verificare come viene registrato il peso
- [ ] Definire lotto/contenitore e identificativo tecnico
- [ ] Definire quali dati possono essere condivisi
- [ ] Escludere dati sanitari e personali non necessari

## 2. Pesatura
- [ ] Registrare peso lordo, tara e netto quando disponibili
- [ ] Registrare unità di misura
- [ ] Registrare timestamp
- [ ] Collegare `scale_ref`
- [ ] Collegare eventuale calibrazione
- [ ] Collegare documento/registro della pesatura
- [ ] Assegnare stato evidenza iniziale

## 3. Trasporto
- [ ] Collegare il lotto al riferimento di ritiro/trasporto
- [ ] Registrare partenza o presa in carico
- [ ] Mantenere il collegamento tra lotto e documenti autorizzati

## 4. Impianto
- [ ] Registrare ricezione del lotto
- [ ] Registrare peso in ingresso
- [ ] Confrontare con pesatura pre-trasporto
- [ ] Annotare scostamenti e anomalie
- [ ] Registrare quantità effettivamente trattata
- [ ] Registrare frazioni/materiali recuperati

## 5. MRV / KPI
- [ ] Calcolare kg pre-trasporto
- [ ] Calcolare kg ricevuti
- [ ] Calcolare scostamento % sui record accoppiati
- [ ] Calcolare kg trattati
- [ ] Calcolare kg recuperati
- [ ] Calcolare resa di recupero %
- [ ] Calcolare coverage delle evidenze

## 6. Evidence Layer
- [ ] Distinguere `DECLARED`, `MEASURED`, `DOCUMENTED`, `CROSS_CHECKED`, `VERIFIED`
- [ ] Definire chi può validare ogni passaggio
- [ ] Conservare audit trail dei cambi di stato
- [ ] Usare hash/signature solo come prova di integrità/provenienza
- [ ] Non considerare blockchain come prova automatica della correttezza fisica del dato

## 7. Chiusura pilot
- [ ] Verificare completezza dati
- [ ] Verificare anomalie aperte
- [ ] Validare KPI/MRV
- [ ] Separare risultati verificati da stime o dichiarazioni
- [ ] Preparare un evidence pack non sensibile
- [ ] Documentare cosa è replicabile in un'altra struttura

## Collegamenti
- `HOSPITAL-AHP-PILOT.md`
- `HOSPITAL-WEIGHING-DATA-SCHEMA.md`
- `HOSPITAL-AHP-MRV-KPI.md`
- `HOSPITAL-AHP-EVIDENCE-PROTOCOL.md`
- `HOSPITAL-AHP-PRIVACY-BOUNDARIES.md`
- Issue #1051
