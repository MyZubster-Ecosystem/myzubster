# Bounties — MyZubster Ecosystem

Questo documento descrive il sistema di bounty del progetto MyZubster, il ciclo di vita delle issue e le regole per contributor e pagamenti.

## Reward multi-asset

Una bounty può avere una o più componenti di reward esplicite:

- `MYZ` — rail disponibile subito;
- `XMR` — selezionabile anche prima del lancio del Treasury/payment rail XMR, ma resta `pending` fino all'attivazione e verifica;
- `TOKEN` — token blockchain identificato da chain/network ID e contract address; resta `pending` finché il relativo payment rail non è abilitato;
- combinazioni `MYZ + XMR`, `MYZ + TOKEN`, `XMR + TOKEN` o `MYZ + XMR + TOKEN`.

Non sono ammesse conversioni implicite tra asset.

Per ogni componente vengono registrati asset, quantità canonica, stato, network (se applicabile), contract address (token), wallet del contributor, transaction ID e riferimenti di funding/verifica.

## Wallet contributor

Il contributor fornisce il wallet di destinazione per ogni asset selezionato. Il wallet ricevuto è l'unico destinatario della payment attempt.

- Nessun fallback silenzioso a un wallet della piattaforma.
- Wallet mancante o non valido blocca il settlement.
- Dopo l'inizio del settlement, il wallet è immutabile per quella attempt.
- Una correzione richiede cancellazione/reissue e audit trail.

Non pubblicare mai private key, seed phrase, password o altri segreti.

## Mappatura bounty

| Originale | Issue | Titolo | Ricompensa | Stato |
|-----------|-------|--------|------------|-------|
| #001 | [#390](https://github.com/MyZubster-Ecosystem/myzubster/issues/390) | Eva Ioni Simulator | 250 MYZ | `AVAILABLE` |
| #002 | [#391](https://github.com/MyZubster-Ecosystem/myzubster/issues/391) | Space Station Telemetry System | 250 MYZ | `AVAILABLE` |
| #003 | [#392](https://github.com/MyZubster-Ecosystem/myzubster/issues/392) | Space Station Telemetry Dashboard | 250 MYZ | `AVAILABLE` |
| #004 | [#393](https://github.com/MyZubster-Ecosystem/myzubster/issues/393) | Gateway API Integration | 250 MYZ | `AVAILABLE` |
| #005 | [#394](https://github.com/MyZubster-Ecosystem/myzubster/issues/394) | MYZ/XMR Payment Integration | 250 MYZ | `AVAILABLE` |

## Ciclo di vita

```text
AVAILABLE
↓
CLAIMED
↓
IN PROGRESS
↓
PR OPEN
↓
MERGED
↓
PAYMENT PENDING
↓
PAYMENT SUBMITTED
↓
PAYMENT VERIFIED
↓
PAID
```

Per reward multi-asset, ogni componente ha il proprio settlement state. La bounty diventa `PAID` solo quando tutte le componenti previste hanno completato la verifica richiesta.

Il label `bounty:paid` viene applicato solo quando il pagamento è verificato.

## Claim e wallet

Il claim deve dichiarare contributor, issue, PR quando disponibile, reward richiesto e destinazioni wallet per gli asset selezionati.

Esempio:

```markdown
## Bounty claim

**Contributor:** @TUO_USERNAME
**Issue:** #XXX
**PR:** #XXX
**Requested reward:** MYZ + XMR
**Wallet MYZ:** [indirizzo pubblico]
**Wallet XMR:** [indirizzo pubblico]
**Payment status:** PENDING

> Never post private keys, seed phrases, passwords, or other secrets.
```

## Verifica pagamento

Il merge della PR non costituisce prova di pagamento.

Prima di `CONFIRMED`/`PAID`, una verifica indipendente deve controllare almeno:

- recipient/wallet;
- asset;
- network/chain ID;
- contract address per i token;
- quantità canonica;
- transaction ID/hash;
- stato della transazione e conferme richieste.

Un response dell'adapter da solo non è sufficiente per segnare `PAID`.

## Treasury

Per XMR e token il flusso economico è:

```text
Market revenue
    ↓
Treasury
    ↓
Bounty allocation / reservation
    ↓
Contributor wallet
    ↓
Payment submission
    ↓
Independent verification
    ↓
PAID
```

L'allocazione dei fondi non equivale al pagamento e il pagamento inviato non equivale alla conferma.
