# Dossier storico — Darkode e transazioni

_Last update: 2026-08-20_

## Scopo
Raccogliere in modo cronologico, verificabile e **public-safe** le evidenze disponibili relative a:
1. collegamento storico con il forum Darkode;
2. attività Bitcoin storica associata al materiale archiviato;
3. cronologia e struttura dei flussi on-chain;
4. separazione rigorosa tra fatti verificabili, attribuzioni plausibili e dichiarazioni auto-riferite.

Il dossier non pubblica indirizzi email personali, indirizzi BTC completi, identificativi wallet, token, credenziali, chiavi private o seed.

## 1. Stato sintetico delle evidenze

- **Darkode / comunicazioni 2015:** evidenza storica supportata da due messaggi inoltrati attribuiti a Darkode Staff02 e dal materiale visuale archiviato.
- **Attività Bitcoin 2014–2015:** evidenza on-chain sostanziale relativa all'indirizzo sotto analisi; l'indirizzo completo è omesso dal dossier pubblico.
- **Continuità con la casella storica:** supportata da una notifica Blockchain.info del 19 novembre 2015 inoltrata dalla stessa continuità documentale.
- **Uso operativo del wallet:** fortemente supportato dalla quantità, ricorrenza e struttura delle transazioni on-chain.
- **Uso di Electrum come client, servizio di mixing, provenienza da miner in Cina e successivo passaggio a Monero:** dichiarazioni storiche auto-riferite, coerenti con il contesto descritto ma non ancora dimostrate in modo indipendente dagli artefatti pubblici attuali.
- **Compromissione di una successiva istanza Onion di Darkode:** dichiarazione auto-riferita, non usata come prova nel presente dossier e non verificata dall'archivio corrente.

## 2. Evidenze Darkode

### 25 febbraio 2015
Email attribuita a `Darkode Staff02 <news02@darkode.me>` con oggetto:
`.: darkode :. We want you!`

Nel materiale allegato compare la frase:
“You are receiving this email because you used to be or presently are a member of the darkode forum.”

Questa evidenza supporta l'esistenza di un collegamento storico tra il destinatario della comunicazione e una membership attuale o passata del forum Darkode.

### 4 marzo 2015
Seconda email attribuita a `Darkode Staff02 <news02@darkode.me>` con oggetto:
`darkode - The forum is back!`

Il messaggio rafforza la continuità delle comunicazioni ricevute nel periodo.

### Limite di autenticazione
Le copie disponibili sono messaggi inoltrati nel 2026. Gli header del forward autenticano l'inoltro corrente, ma non trasformano automaticamente il testo incorporato del 2015 in una comunicazione DKIM-verificata direttamente da `darkode.me`.

## 3. Evidenza Bitcoin e identificatore public-safe

Una notifica Blockchain.info del **19 novembre 2015** documenta una transazione Bitcoin storica nella stessa catena di evidenza privata. Gli identificativi sensibili sono conservati separatamente e non vengono pubblicati qui.

Per consentire una futura verifica senza esporre l'indirizzo completo, il dossier registra il seguente commitment:

- **SHA-256 dell'indirizzo BTC sotto analisi:** `1d4a9409c44722799b4efe1626d069d0cd54fff260dffbd1b7356a168d078062`

Il commitment permette di verificare in futuro che un indirizzo presentato privatamente sia lo stesso usato nell'analisi, senza pubblicarlo nel repository.

## 4. Analisi on-chain dell'indirizzo sotto esame

L'analisi eseguita tramite dati pubblici della blockchain ha ricostruito **483 transazioni confermate**.

### Volume lordo
- movimenti ricevuti lordi: **420.13964651 BTC**;
- movimenti spesi lordi: **420.13964651 BTC**;
- differenza finale osservata: **0.00000000 BTC**.

Questi **420.13964651 BTC non rappresentano BTC posseduti, guadagnati o ricevuti economicamente una sola volta**. Il valore lordo riconta anche fondi che ritornano allo stesso indirizzo come change e vengono spesi nuovamente.

### Classificazione corretta dei movimenti
Un secondo passaggio ha separato le 483 transazioni in:

- **192 depositi esterni**;
- **287 transazioni self/change**;
- **4 uscite senza ritorno allo stesso indirizzo**.

Le tre categorie totalizzano esattamente le 483 transazioni osservate.

Il totale degli output ricevuti dall'indirizzo in **transazioni realmente esterne** è:

- **219.93104055 BTC**.

Anche questo valore è un volume storico ricevuto on-chain e non dimostra da solo proprietà economica esclusiva, profitto, origine lecita/illecita o provenienza da mining.

## 5. Struttura dei flussi

### Fan-out e transazioni multi-input/multi-output
Sono presenti transazioni nelle quali l'indirizzo sotto analisi partecipa insieme ad altri input a strutture di forte distribuzione.

Esempi documentati:

- una transazione con **25 input e 20 output**, valore complessivo di input **294.98447633 BTC**, nella quale l'indirizzo sotto analisi contribuiva **10.07826943 BTC**;
- una transazione con **18 input e 21 output**, valore complessivo di input **14.82993891 BTC**, nella quale l'indirizzo sotto analisi contribuiva **1.61935465 BTC**.

Gli importi complessivi di queste transazioni **non devono essere attribuiti interamente all'indirizzo sotto analisi**.

### Catene di redistribuzione
Nel marzo 2015 è osservabile una sequenza di spesa e change del tipo:

`~6.62 BTC → ~6.60 BTC → ~5.87 BTC → ~5.83 BTC → ~5.79 BTC → ~5.75 BTC`

con importi più piccoli separati lungo i passaggi.

Questa struttura è compatibile con gestione operativa di fondi, pagamenti sequenziali o altre attività di wallet. Una peeling chain **non è da sola prova di un servizio di mixing**.

## 6. Sorgenti esterne ricorrenti

L'analisi dei 192 depositi esterni mostra controparti ricorrenti. Per ragioni di privacy, il repository registra commitment SHA-256 invece degli indirizzi completi.

| Nodo public-safe | SHA-256 dell'indirizzo sorgente | Depositi distinti | UTXO input osservati | Somma valori degli UTXO sorgente nelle TX |
|---|---|---:|---:|---:|
| Source A | `8bf0e604965caeedb1299ba4a27891281d194788415df26a3391b818a5d48c97` | 16 | 32 | 10.02122298 BTC |
| Source B | `5568608f86ab2d86d43fe40d3a498d2623350d27ace33d227586567a9616a3ad` | 8 | 8 | 1259.00000000 BTC |
| Source C | `2617267002011d9b14121c8264fd3848797f90999b544e59c1002d63d56ef4d7` | 4 | 7 | 13.93534550 BTC |
| Source D | `c48af890032ac54a45b7002d44aa53e11f71881c0805ab0d2a47f108fd4c6746` | 4 | 4 | 8.63044544 BTC |
| Source E | `941be862491c04d165514cdcdd5f02ec3734b557aa30d59e0028fd3929c8e51a` | 4 | 7 | 6.83884200 BTC |
| Source F | `54ff82fb3ccbcd2569fe06dad9c64a7bbf52eaff7cfdc3e48fa857ad8d8d5da3` | 4 | 18 | 5.88701261 BTC |

**Interpretazione importante:** la colonna finale somma il valore degli UTXO che le sorgenti stavano spendendo nelle transazioni considerate; **non è l'importo ricevuto dall'indirizzo sotto analisi**.

Source A è il rapporto di finanziamento più ricorrente nel dataset. Source B è meno ricorrente, ma compare in transazioni alimentate da UTXO sorgente di scala molto maggiore.

## 7. UTXO upstream di grande dimensione

Tra i depositi esterni sono stati osservati ingressi provenienti da transazioni i cui input sorgente includevano UTXO da, tra gli altri:

- **466.38487641 BTC**;
- **397.46464671 BTC**;
- **168.77600000 BTC**;
- **145.09990000 BTC**;
- **109.00000000 BTC**;
- **94.99990000 BTC**.

Questi numeri descrivono la **scala degli UTXO a monte**, non gli importi ricevuti dal wallet sotto analisi. Il fatto che una controparte spenda un UTXO da centinaia di BTC per creare un output più piccolo verso il wallet non implica che il wallet controllasse l'intero UTXO sorgente.

## 8. Interpretazione tecnica supportata

Il dataset permette oggi una conclusione più forte rispetto alla versione iniziale del dossier:

> L'indirizzo Bitcoin sotto analisi mostra un'attività storica sostanziale e continuativa tra il 2014 e il 2015, con centinaia di transazioni, depositi esterni ripetuti, self-change frequente, consolidamenti, fan-out e relazioni ricorrenti con controparti che movimentavano UTXO di dimensione significativa.

Questa evidenza è coerente con **uso operativo e non occasionale di infrastruttura Bitcoin**.

Non è sufficiente, da sola, per concludere che:
- l'indirizzo fosse un mixing service;
- i fondi provenissero da miner o mining pool;
- tutti i fondi movimentati appartenessero economicamente allo stesso soggetto;
- una determinata controparte fosse un exchange, pool o servizio senza ulteriore attribuzione indipendente;
- l'attività on-chain certifichi automaticamente una specifica skill professionale.

## 9. Contesto storico auto-riferito

Il seguente contesto è stato dichiarato dal soggetto associato al dossier e viene conservato separatamente dalle evidenze verificate:

1. uso di **Electrum** come software wallet e utilizzo dell'indirizzo analizzato come destinazione operativa;
2. attività storica descritta come servizio di **Bitcoin mixing** nel contesto Darkode;
3. utilizzo di miner collocati in Cina e collegamento dichiarato tra attività di mining e disponibilità di BTC;
4. successivo interesse e passaggio operativo verso **Monero** per le sue caratteristiche di privacy;
5. dichiarazione separata di aver compromesso una successiva istanza Onion di Darkode dopo il takedown del 2015.

Questi elementi restano **self-reported / non verificati indipendentemente** salvo futura acquisizione di artefatti contemporanei: report tecnici, log, payout di mining pool, configurazioni, file wallet verificabili, firme crittografiche, screenshot con provenienza, corrispondenza storica o altri documenti indipendenti.

## 10. Cosa il dossier NON dimostra

Il materiale disponibile non dimostra automaticamente:
- username/handle specifico usato su Darkode;
- attività svolte sul forum;
- partecipazione a condotte illecite;
- compromissione di un servizio Onion;
- controllo attuale di un wallet storico;
- proprietà economica di tutti gli UTXO presenti nelle transazioni collegate;
- collegamento diretto e verificato tra Darkode, mixing e mining;
- provenienza dei BTC da specifici miner o mining pool;
- identità civile completa;
- livello professionale di competenza esclusivamente sulla base dei flussi finanziari.

## 11. Metodo e livelli di evidenza

Il dossier distingue sempre:

- **Verificato / on-chain** — dato riproducibile dalla blockchain o da un artefatto pubblico verificabile;
- **Evidence-supported / attribuito** — ricostruzione sostenuta da più elementi coerenti, ma non equivalente a prova crittografica d'identità o controllo;
- **Self-reported / non verificato** — dichiarazione storica non ancora confermata da evidenza indipendente.

Per l'analisi Bitcoin sono stati separati:
- valore lordo movimentato;
- depositi realmente esterni;
- self/change;
- uscite definitive;
- valore del singolo output ricevuto;
- valore complessivo degli input della transazione;
- valore degli UTXO delle controparti a monte.

Questa separazione evita di attribuire erroneamente al wallet importi che appartengono alla transazione complessiva o alle controparti.

## 12. Stato conclusivo al 2026-08-20

La parte **Bitcoin storica** non è più soltanto una dichiarazione: esiste una traccia on-chain consistente e quantificabile che documenta uso continuativo e materialmente significativo dell'indirizzo analizzato.

La relazione storica con **comunicazioni Darkode** è supportata dall'archivio disponibile. La narrativa relativa a **mixing, mining in Cina, uso di Electrum, passaggio a Monero e compromissione di una successiva istanza Onion** rimane invece esplicitamente separata come contesto auto-riferito finché non viene corroborata da ulteriori artefatti indipendenti.

La formulazione pubblica corretta è quindi:

> **Historical Bitcoin operational provenance (2014–2015): evidence-supported by substantial on-chain activity and archived communications. Specific claims concerning mixing, mining origin, Darkode operational activity or later Onion compromise remain self-reported unless independently corroborated.**
