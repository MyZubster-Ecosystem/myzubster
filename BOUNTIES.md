# Bounties — MyZubster Ecosystem

Questo documento descrive il sistema di bounty del progetto MyZubster, il ciclo di vita delle issue e le regole per contributor e pagamenti.

---

## 📌 Mappatura bounty

Le bounty originariamente descritte nella documentazione dello Space Station MVP sono state formalizzate come issue pubbliche nel repository principale.

| Originale | Issue | Titolo | Ricompensa | Stato |
|-----------|-------|--------|------------|-------|
| #001 | [#390](https://github.com/MyZubster-Ecosystem/myzubster/issues/390) | Eva Ioni Simulator | 250 MYZ | `AVAILABLE` |
| #002 | [#391](https://github.com/MyZubster-Ecosystem/myzubster/issues/391) | Space Station Telemetry System | 250 MYZ | `AVAILABLE` |
| #003 | [#392](https://github.com/MyZubster-Ecosystem/myzubster/issues/392) | Space Station Telemetry Dashboard | 250 MYZ | `AVAILABLE` |
| #004 | [#393](https://github.com/MyZubster-Ecosystem/myzubster/issues/393) | Gateway API Integration | 250 MYZ | `AVAILABLE` |
| #005 | [#394](https://github.com/MyZubster-Ecosystem/myzubster/issues/394) | MYZ/XMR Payment Integration | 250 MYZ | `AVAILABLE` |

---

## 🔄 Ciclo di vita di una bounty

Ogni bounty segue questa sequenza di stati:
AVAILABLE
↓
CLAIMED (contributor dichiara di volerla prendere in carico)
↓
IN PROGRESS (il lavoro è iniziato)
↓
PR OPEN (pull request aperta per revisione)
↓
MERGED (PR approvata e mergiata)
↓
PAYMENT PENDING (pagamento in corso di elaborazione)
↓
PAYMENT VERIFIED (pagamento confermato e verificabile)
text


Il label `bounty:paid` viene applicato **solo** quando il pagamento è stato verificato.

---

## 📝 Come fare claim di una bounty

1. **Commenta** sull'issue con il template:
   ```markdown
   ## Bounty claim

   **Contributor:** @TUO_USERNAME
   **Issue:** #XXX
   **PR:** #XXX (dopo averlo aperto)
   **Requested reward:** 250 MYZ
   **Wallet / payment destination:** [indirizzo pubblico]
   **Payment network:** [XMR / MYZ]
   **Payment status:** PENDING

   > Never post private keys, seed phrases, passwords, or other secrets.

    Apri una pull request che risolve l'issue.

    Attendi la review e le eventuali modifiche richieste.

    Dopo il merge, il pagamento verrà elaborato e registrato pubblicamente.

💰 Pagamento e verifica

    Il pagamento viene effettuato dopo il merge della PR.

    La bounty non è considerata pagata fino a quando non viene registrato un transaction ID verificabile.

    Per pagamenti in XMR, il TXID deve essere pubblicato nella issue.

    Per pagamenti in MYZ, devono essere documentati blockchain/network, contratto/token e TXID.

Esempio di verifica pagamento
markdown

## Payment verification

**Bounty:** #XXX
**Contributor:** @USERNAME
**Amount:** 250 MYZ
**Currency:** XMR
**Network:** Monero mainnet
**Transaction ID:** [TXID]
**Status:** CONFIRMED
**Verification:** [link a explorer o evidenza verificabile]

⚠️ Regole importanti

    Nessuna chiave privata, seed phrase o segreto deve essere mai committato o pubblicato.

    Solo indirizzi pubblici e TXID possono essere inclusi nella documentazione delle issue.

    Il merge di una PR non costituisce prova di pagamento.

    La bounty è una ricompensa dichiarata dal progetto; il pagamento deve essere separatamente registrato e verificabile.

🔗 Riferimenti

    Space Station README

    Repository principale

    Issue aperte

