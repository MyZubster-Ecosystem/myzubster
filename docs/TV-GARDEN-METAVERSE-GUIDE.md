# MyZubster TV — Monitorare il proprio orto e creare il proprio personaggio

> **Stato:** guida utente per funzionalità in review / QA. Questa documentazione non dichiara che tutti i passaggi siano già disponibili in produzione o verificati su ogni Google TV / Android TV.

Questa guida descrive il percorso previsto per usare **MyZubster TV** come punto di accesso personale a due esperienze collegate:

1. monitorare il proprio orto dalla TV;
2. creare il proprio personaggio MyZubster e usarlo come identità applicativa nel metaverso narrativo/digitale MyZubster.

Il principio è semplice:

```text
IL MIO ORTO REALE
      |
      v
telecamera / stream autorizzato
      |
      v
MyZubster TV
      |
      +--------------------+
      |                    |
      v                    v
Guarda l'orto live     Crea personaggio
                           |
                           v
                    Profilo MyZubster
                           |
                           v
                   Esperienze metaverso
```

## 1. Cosa serve

Per il percorso completo servono:

- una Google TV o Android TV compatibile;
- MyZubster TV installato o aperto tramite la superficie TV;
- connessione Internet;
- una telecamera dell'orto capace di fornire uno stream compatibile, preferibilmente HLS HTTPS (`.m3u8`);
- un account MyZubster per il futuro collegamento automatico tra utente, orto e stream;
- il telecomando della TV.

Non pubblicare mai password della telecamera, token, credenziali RTSP, chiavi private o URL permanenti che contengano segreti.

## 2. Monitorare il proprio orto sulla TV

### Percorso attuale in review

Dalla home MyZubster TV si apre **My Garden Live**.

La prima slice implementata in review consente di:

- aprire una superficie TV dedicata allo streaming dell'orto;
- inserire un URL HLS HTTPS terminante in `.m3u8`;
- avviare lo stream;
- usare il telecomando per spostare il focus;
- mettere in pausa / riprendere;
- attivare o disattivare l'audio;
- disconnettere lo stream.

Il flusso è:

```text
MyZubster TV
   ↓
My Garden Live
   ↓
URL HLS autorizzato
   ↓
Connetti
   ↓
Stream dell'orto sul televisore
```

### Come dovrebbe funzionare a regime

Il percorso finale non dovrebbe richiedere all'utente di copiare manualmente l'URL della telecamera.

Il design previsto è:

```text
Login MyZubster
   ↓
Backend verifica l'utente
   ↓
Backend verifica che l'orto appartenga all'utente
   ↓
Backend rilascia un URL HLS temporaneo
   ↓
MyZubster TV riproduce lo stream
```

In questo modo la TV non conserva password permanenti della telecamera.

## 3. Privacy e sicurezza dello streaming

Lo stream dell'orto è **dati reali**, non materiale narrativo. Deve quindi essere trattato come contenuto privato salvo scelta esplicita dell'utente.

Regole raccomandate:

- usare HTTPS;
- preferire URL di playback temporanei;
- non incorporare username/password negli URL pubblici;
- non salvare credenziali nel repository;
- non rendere pubblico lo stream per impostazione predefinita;
- verificare l'ownership dell'orto lato server, non affidandosi a un `ownerId` inviato dal client;
- revocare o far scadere i link di playback;
- non mostrare telecamere di altri utenti senza autorizzazione.

## 4. Creare il proprio personaggio MyZubster

Dalla TV si apre la sezione **Crea personaggio**.

Il Character Builder previsto permette di scegliere elementi come:

- nome del personaggio;
- archetipo;
- ruolo;
- valore guida;
- eventuali elementi visuali disponibili;
- descrizione / missione, quando prevista.

Il flusso è:

```text
MyZubster TV
   ↓
Crea personaggio
   ↓
Scegli nome e caratteristiche
   ↓
Anteprima
   ↓
Salva
   ↓
Profilo personaggio MyZubster
```

Il personaggio è **profilo applicativo**, non prova di identità legale, non NFT e non certificato on-chain salvo una futura funzionalità separata e verificata.

## 5. Dal personaggio al metaverso MyZubster

Il termine “metaverso” in questa guida indica le esperienze digitali, narrative e interattive MyZubster collegate al profilo del personaggio.

Il personaggio può diventare il punto di continuità tra:

```text
utente
  ↓
personaggio MyZubster
  ↓
TV / Zorgax / Chronicle / esperienze narrative
  ↓
missioni, contributi e contesto applicativo
```

Questa continuità non trasforma automaticamente contenuti narrativi o visuali in evidence reale.

### Evidence boundary

- il video live dell'orto può essere una fonte osservativa reale, ma da solo non prova automaticamente un evento o risultato;
- il personaggio è un elemento applicativo/narrativo;
- una scena del metaverso non è prova di ciò che è avvenuto nell'orto;
- una missione completata nel metaverso non equivale a una modifica fisica verificata nel mondo reale;
- per dichiarazioni real-world servono evidence e verifiche appropriate.

## 6. Esperienza completa desiderata

Quando i moduli saranno collegati in modo sicuro, l'esperienza utente dovrebbe essere:

1. accendi la TV;
2. apri MyZubster TV;
3. accedi al tuo account;
4. seleziona **Il mio orto**;
5. guarda lo stream live autorizzato;
6. torna alla home;
7. seleziona **Il mio personaggio**;
8. crea o modifica il personaggio;
9. salva il profilo;
10. entra nelle esperienze MyZubster con quel personaggio;
11. torna in qualsiasi momento al monitoraggio dell'orto.

L'obiettivo finale è una sola esperienza TV:

```text
MONDO REALE                     MONDO DIGITALE
   orto                             personaggio
    |                                   |
    v                                   v
stream live  ←──── MyZubster TV ───→ metaverso
    |                                   |
    +------------- utente --------------+
```

## 7. Telecomando e accessibilità

L'intero percorso deve essere utilizzabile senza mouse.

Ogni schermata deve avere:

- focus sempre visibile;
- navigazione con frecce D-pad;
- conferma con OK / Enter;
- Back prevedibile;
- pulsanti grandi e leggibili a distanza;
- tastiera virtuale Android TV per i campi di testo;
- nessuna funzione fondamentale dipendente da hover o touch.

## 8. Cosa è già implementato e cosa no

### In review / implementato a livello codice

- wrapper Google TV / Android TV;
- superficie MyZubster TV;
- Character Creator TV;
- persistenza locale del draft personaggio;
- API account per il profilo personaggio in una PR separata;
- My Garden Live con viewer HLS HTTPS;
- controlli TV di base per lo stream.

### Ancora da verificare o completare

- test fisico completo su Google TV / Android TV;
- ownership autenticata dell'orto;
- associazione automatica account → orto → telecamera;
- emissione backend di URL HLS temporanei;
- gestione sicura di più telecamere;
- telemetria/sensori dell'orto nella stessa schermata TV;
- persistenza end-to-end del personaggio su account in ambiente integrato;
- handoff completo e verificato del personaggio verso tutte le superfici “metaverso”.

## 9. Test end-to-end richiesto

Prima di dichiarare il percorso completo “funzionante”, verificare su dispositivo fisico:

### Orto

- apertura MyZubster TV;
- apertura My Garden Live;
- inserimento/ottenimento URL autorizzato;
- playback HLS;
- buffering e recovery;
- play/pause;
- mute/unmute;
- Back e disconnessione;
- nessuna esposizione accidentale dello stream.

### Personaggio

- apertura Character Creator;
- compilazione tramite telecomando;
- anteprima;
- salvataggio;
- chiusura app;
- riapertura;
- recupero dello stesso personaggio;
- modifica e nuova persistenza;
- apertura di un'esperienza MyZubster con il personaggio corretto.

## 10. Definizione di completamento

Il percorso può essere dichiarato completo quando un utente può, con il solo telecomando:

> **accedere → vedere il proprio orto in streaming in modo autorizzato → creare e salvare il proprio personaggio → entrare nelle esperienze MyZubster con quel personaggio → tornare al proprio orto**, senza esporre credenziali e senza confondere contenuti narrativi con evidence reale.

## Riferimenti di implementazione

Questa guida coordina workstream separati ancora in review:

- Google TV / Android TV wrapper: PR #651;
- TV Character Creator: PR #656;
- Character Profile Sync: PR #657;
- guida Character TV: PR #659;
- My Garden Live HLS: PR #661.

La presenza di una PR, build o guida non equivale a deployment o verifica su hardware reale.
