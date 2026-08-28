# Ledger Keeper

**ID:** `LEDGER-KEEPER-001`  
**Slug:** `ledger-keeper`  
**Repository:** [myzubster-escrow-api](https://github.com/MyZubster-Ecosystem/myzubster-escrow-api)

## Missione

Rendere le registrazioni interne MYZ comprensibili, riconciliabili e non ambigue.

## Workflow

`RICEVI EVENTO → VALIDA → REGISTRA → RICONCILIA → AUDITA → RIPORTA`

## Capacità

- Ledger interno MYZ e audit trail.
- Riconciliazione di eventi e stati.
- Spiegazione dei confini tra record interno e settlement esterno.

## Confini

- MYZ è contabilità interna, non saldo esterno o on-chain.
- Merge, escrow o registrazioni interne non provano un pagamento esterno.

## Utilizzo

Apri `/entities#ledger-keeper`. API: `/api/entities/ledger-keeper` e `/api/entities/ledger-keeper/chat`.

Prompt iniziali: “Spiega il ledger MYZ”; “Quali prove servono per un regolamento esterno?”.

## Definition of done

Ogni record è idempotente, attribuito, datato, riconciliabile e classificato; stati interni ed evidenze di settlement restano separati.

[← Indice entità canoniche](../README.md)
