# MyZubster Lavori e MyZubster TV

Guida rapida per capire **dove trovare, come scaricare, installare e usare** le build pubbliche di test di MyZubster.

> **Stato:** entrambe le app sono build di test/beta. Non sono release di produzione distribuite tramite Google Play Store.

## Download rapido

La pagina centrale per i download è:

- **MyZubster Apps:** https://myzubster.com/apps

### MyZubster Lavori — Beta v1

- Release: https://github.com/MyZubster-Ecosystem/MyZubster-App/releases/tag/lavori-beta-v1
- APK diretto: https://github.com/MyZubster-Ecosystem/MyZubster-App/releases/download/lavori-beta-v1/MyZubster-Lavori-Beta-v1.apk
- Tag: `lavori-beta-v1`

### MyZubster TV — Debug 001

- Release: https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001
- APK diretto: https://github.com/MyZubster-Ecosystem/myzubster/releases/download/google-tv-debug-001/app-debug.apk
- Tag: `google-tv-debug-001`
- Dimensione documentata: 3,518,984 byte (~3.35 MiB)
- SHA-256: `f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704`

## MyZubster Lavori: come funziona

MyZubster Lavori è la beta Android dedicata all'area **lavori / bounty / contributi** dell'ecosistema MyZubster.

La build pubblicata espone un flusso di test pensato per:

1. cercare lavori o bounty disponibili;
2. usare filtri per trovare attività adatte;
3. vedere le informazioni sul reward associato al lavoro;
4. aprire il dettaglio dell'attività;
5. provare il flusso locale di candidatura.

Il repository dell'app contiene anche i client flow più generali dell'ecosistema, inclusi autenticazione e contratti verso il Gateway. La presenza di una schermata nell'app non dimostra però che ogni servizio backend o pagamento esterno sia operativo: per le operazioni esterne lo stato del Gateway/verificatore resta la fonte autorevole.

### Installazione su Android

1. Apri `https://myzubster.com/apps` dal telefono oppure usa il link APK diretto sopra.
2. Scarica `MyZubster-Lavori-Beta-v1.apk`.
3. Android potrebbe chiedere di autorizzare temporaneamente l'installazione di app provenienti dal browser/file manager utilizzato.
4. Installa l'APK.
5. Apri MyZubster Lavori e prova ricerca, filtri, dettagli reward e candidatura.

Per aggiornare una beta esistente, scarica la build indicata dalla pagina `/apps` o dalla release ufficiale e installala sopra la versione precedente quando Android consente l'aggiornamento.

## MyZubster TV: come funziona

MyZubster TV è la build di test per **Android TV / Google TV**. È pensata per portare l'accesso all'ecosistema MyZubster sul televisore e validare l'esperienza TV.

La build `google-tv-debug-001` deve essere considerata un artefatto di sviluppo. I test reali devono verificare almeno:

- presenza dell'app nel launcher TV;
- navigazione con telecomando e D-pad;
- focus dei controlli;
- caricamento WebView/pagine;
- link Chronicle/ecosistema;
- comportamento del tasto Back;
- leggibilità a distanza TV;
- rete e API;
- crash o errori visibili.

### Verifica dell'APK TV

Prima dell'installazione puoi controllare il file con PowerShell:

```powershell
Get-FileHash .\app-debug.apk -Algorithm SHA256
```

Il risultato deve essere:

```text
f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704
```

Se il digest non coincide, non installare quella copia.

### Installazione TV con ADB

Installa Android Platform Tools sul computer e verifica ADB:

```powershell
adb version
```

Sul televisore abilita **Developer options** e il debugging USB o wireless. Se usi il debugging wireless, PC e TV devono trovarsi sulla stessa rete fidata e devi usare IP e porta mostrati dal televisore.

Controlla i dispositivi:

```powershell
adb devices
```

Per una TV in rete:

```powershell
adb connect TV_IP:PORT
adb devices
```

Non presumere che la porta sia `5555`: usa quella indicata dal dispositivo.

Installa o aggiorna l'APK:

```powershell
adb install -r .\app-debug.apk
```

Dopo i test, disabilita il debugging se non serve più.

## Problemi comuni su MyZubster TV

Se ADB mostra `unauthorized`, accetta la richiesta di autorizzazione sul televisore. Se il dispositivo non compare, controlla debugging, pairing, IP/porta, firewall e rete locale. Se compare `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, potrebbe esserci già una copia firmata con una chiave diversa: prima di disinstallarla verifica se devi conservare dati locali.

Se l'app viene installata ma non compare nel launcher TV, consideralo un risultato di QA: vanno controllate le dichiarazioni TV/launcher nel manifest invece di presumere un problema del televisore.

## Sicurezza

Non pubblicare mai seed phrase, chiavi private, token di autenticazione, API secret, credenziali di debugging o informazioni private non necessarie sulla rete/dispositivo. Le build qui indicate sono per test: usa preferibilmente dispositivi e account destinati alla sperimentazione.

## Sviluppatori

Codice principale dell'ecosistema:

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
```

Client app:

```bash
git clone https://github.com/MyZubster-Ecosystem/MyZubster-App.git
cd MyZubster-App
npm ci
npx expo start
```

Per funzioni native Android:

```bash
npx expo prebuild --clean
npx expo run:android
```

## Documentazione correlata

- Google TV: `docs/google-tv/README.md`
- Panoramica Google TV: `docs/GOOGLE_TV.md`
- Come funziona MyZubster: `docs/COME_FUNZIONA.md`
- Ecosistema: `docs/ECOSYSTEM.md`
- Bounty: `BOUNTIES.md`
- Come partecipare: `JOIN.md`

---

**MyZubster è open source.** Per bug, test e contributi usa le Issue e Pull Request dei repository ufficiali MyZubster.