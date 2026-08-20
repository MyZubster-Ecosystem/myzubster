# Addendum di verifica — Darkode, email inoltrate e prova BTC

Data verifica: 2026-08-20

## Scopo
Questo addendum registra in forma pubblicabile i controlli effettuati sul materiale storico, senza esporre dati personali o finanziari non necessari.

## Evidenze controllate

### 1. Comunicazione Darkode — 25 febbraio 2015
È presente una email inoltrata nel 2026 che contiene un messaggio attribuito a Darkode Staff02, datato 25 febbraio 2015, con oggetto `.: darkode :. We want you!`.

Il testo incorporato dichiara che il destinatario riceve il messaggio perché era o era stato membro del forum Darkode.

L'allegato storico `welcome.png` è stato recuperato dalla email inoltrata.

SHA-256 dell'allegato originale recuperato dalla email:
`0fbfd23e2ecfe6bb3bfac38343c76af9cae2a1cbddb398d7e669088dd5a8ca46`

### 2. Comunicazione Darkode — 4 marzo 2015
È presente una seconda email inoltrata nel 2026 che contiene un messaggio attribuito a Darkode Staff02, datato 4 marzo 2015, con oggetto `darkode - The forum is back!`.

Il testo ripete il riferimento a una membership attuale o passata del forum, rafforzando la continuità temporale delle comunicazioni ricevute.

### 3. Evidenza Bitcoin — 19 novembre 2015
È presente una email inoltrata nel 2026 contenente una notifica attribuita a Blockchain.info, datata 19 novembre 2015, relativa a un pagamento Bitcoin inviato.

La notifica contiene un TXID, indirizzi BTC e un identificatore di wallet. Questi dati non vengono pubblicati in chiaro in questo repository perché, combinati con una identità personale, costituiscono informazioni finanziarie sensibili.

Per consentire una futura verifica senza pubblicare i valori originali, vengono registrati commitment SHA-256:

- TXID commitment: `481b41d55952b85980d67260fc0cee51f24e36818321e5ecab9fdf16ef6fa51d`
- BTC address commitment A: `1d4a9409c44722799b4efe1626d069d0cd54fff260dffbd1b7356a168d078062`
- BTC address commitment B: `9faeb8faf0a8280729a3826c843780ce916351858b5c6e3b1302ca86da270999`
- wallet identifier commitment: `3818455c004ac5c2cd139f5cbb5bd5cc281647ad53f060c96a6cf07d2b371fec`

## Provenienza dell'immagine
Il file Drive denominato `Darkode_2015_membership_evidence.png` è stato restituito dal provider come JPEG e corrisponde visualmente all'allegato storico `welcome.png` recuperato dalla email.

SHA-256 del file Drive originale analizzato:
`0ad01871418ab46a54db2aca8cc2c96e8f5d923aafad4f25fc90b90b75e2fa7e`

Per GitHub è stata generata una derivata WebP ottimizzata dello stesso contenuto visuale e incorporata in un contenitore SVG testuale, così il repository può conservarla senza pubblicare dati personali aggiuntivi.

- SHA-256 WebP incorporato: `2e39bc473d3e91727c0d3ad8cc1f7728b0b3c6d0df03db88a62b9794a6886e2a`
- file pubblicato: `darkode-2015-membership-evidence-public.svg`
- SHA-256 del file SVG pubblicato: `203e390464d0e7fc7c41fae51a2638168dfaedc0d778581b0c6b4d298b772aca`

## Limiti probatori
Queste evidenze supportano una continuità storica tra un vecchio account/email, comunicazioni Darkode e attività Bitcoin nel 2015. Non dimostrano da sole:

- lo username Darkode utilizzato;
- le attività svolte sul forum;
- partecipazione a condotte illecite;
- il controllo attuale di uno specifico wallet;
- la titolarità legale di una identità civile;
- che un wallet o una transazione siano necessariamente collegati a Darkode.

Le intestazioni Gmail della email inoltrata nel 2026 possono autenticare il trasferimento dal relativo account Gmail al destinatario corrente, ma non trasformano automaticamente il testo incorporato del 2015 in una email originale DKIM-verificata da `darkode.me`.

## Interpretazione per MyZubster Digital Identity
Il materiale può essere usato come **historical provenance evidence** all'interno della futura identità digitale MyZubster, con stato `evidence-supported` o equivalente. Non deve essere usato come unica prova per assegnare lo stato `verified identity`.

Un livello di verifica più forte richiederebbe almeno uno o più dei seguenti:

- prova di controllo crittografico di una chiave storicamente associata;
- firma da un wallet/chiave ancora controllata, se tecnicamente possibile e sicura;
- header originali o archivi originali delle email del 2015;
- ulteriori fonti indipendenti e datate;
- una procedura di attestazione firmata e revocabile nel registro MyZubster.

## Principio di pubblicazione
Le prove complete restano private. GitHub conserva solo materiale public-safe, immagini non contenenti dati personali e commitment crittografici utili a dimostrare in seguito che un dato privato corrispondeva a quello verificato in questa data.
