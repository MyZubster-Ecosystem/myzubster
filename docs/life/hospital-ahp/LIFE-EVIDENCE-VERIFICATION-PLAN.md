# LIFE Evidence & Verification Plan — Hospital AHP/PAP

Status: `PROPOSED / READY FOR VALIDATION`

## Obiettivo
Definire quali prove servono per supportare le dichiarazioni del pilot e come collegarle agli eventi del ciclo AHP/PAP.

## Catena di evidenza minima
1. identificazione lotto/contenitore;
2. pesatura pre-trasporto;
3. riferimento ritiro/trasporto;
4. ricezione/pesatura impianto;
5. trattamento;
6. quantità/frazioni recuperate;
7. KPI derivati.

## Tipi di evidenza
- misura da pesa identificata;
- registro operativo;
- documento di trasporto/ricezione;
- log impianto;
- report di trattamento;
- record firmato/hashato;
- review umana/scientifica quando richiesta.

## Regole di verifica
- ogni evidenza deve avere fonte e timestamp;
- i riferimenti devono poter essere ricondotti allo stesso lotto;
- un hash prova integrità del record, non correttezza della misura fisica;
- documenti incompleti o incoerenti devono degradare il livello di evidenza;
- una verifica non deve cancellare la storia delle correzioni.

## Livelli
- `DECLARED`
- `MEASURED`
- `DOCUMENTED`
- `CROSS_CHECKED`
- `VERIFIED`

## Controlli incrociati prioritari
- peso pre-trasporto vs peso ingresso impianto;
- quantità ricevuta vs quantità trattata;
- quantità trattata vs materiali recuperati;
- presenza/assenza di evidenze minime per ogni passaggio.

## Output
L'Evidence Pack finale dovrebbe contenere dati, riferimenti documentali, KPI, anomalie, metodo di verifica e limiti.

## Boundary
Nessuna evidenza deve includere dati sanitari personali non necessari. La verifica tecnica non sostituisce obblighi legali, autorizzazioni o certificazioni ufficiali.