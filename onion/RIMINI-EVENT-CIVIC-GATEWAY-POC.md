# Rimini Event Civic Gateway — Independent PoC

## Purpose

Preparare una demo tecnica di resilienza per informazioni pubbliche relative a un evento cittadino, usando esclusivamente fonti pubbliche/autorizzate. Il PoC non è un servizio ufficiale del Comune di Rimini, della Diocesi, di Hera, del Meeting o di altri organizzatori.

## Scope

- dati e comunicazioni pubbliche;
- nessun dato personale;
- nessun accesso a sistemi interni;
- nessuna modifica ai sistemi degli enti;
- attribuzione della fonte originale;
- possibilità di rimuovere immediatamente una fonte o un contenuto su richiesta del titolare.

## Architettura demo

```text
Fonti pubbliche/autorizzate
          |
          v
   Civic Data Adapter
          |
          v
    MyZubster Gateway
       /    |    \
      A     B     C
       \    |    /
        Health/Failover
              |
              v
        Client / Demo UI
```

## Piano operativo

### P0 — Preparazione

- [ ] selezionare una fonte pubblica ufficiale;
- [ ] registrare URL, licenza e data di acquisizione;
- [ ] definire uno schema dati minimo;
- [ ] implementare adapter read-only;
- [ ] aggiungere attribution metadata.

### P1 — Gateway locale

- [ ] importare un dataset/feed pubblico;
- [ ] validare schema e integrità;
- [ ] esporre una API read-only;
- [ ] aggiungere health endpoint;
- [ ] aggiungere log tecnici senza PII.

### P2 — Distribuzione

- [ ] avviare Node A;
- [ ] avviare Node B;
- [ ] avviare Node C;
- [ ] configurare health observation;
- [ ] configurare candidate discovery;
- [ ] testare failover in ambiente controllato.

### P3 — Demo resilienza

1. verificare A/B/C disponibili;
2. mostrare il contenuto proveniente dalla fonte ufficiale;
3. rendere A indisponibile volontariamente;
4. verificare che il client utilizzi B/C;
5. ripristinare A;
6. verificare recovery;
7. registrare tempi e risultati.

## Evento papale / informazioni sensibili al tempo

Per contenuti relativi a eventi con forte affluenza, il PoC deve rimandare sempre alle fonti ufficiali per indicazioni operative. Non deve sostituire comunicazioni di sicurezza, emergenza, viabilità o ordine pubblico.

## Gate istituzionale

Prima di qualsiasi uso pubblico come servizio dell'ente:

- [ ] autorizzazione del titolare della fonte;
- [ ] revisione legale/privacy;
- [ ] verifica sicurezza;
- [ ] definizione del responsabile del servizio;
- [ ] SLA e gestione incidenti;
- [ ] procedure di rimozione/correzione;
- [ ] eventuale percorso di interoperabilità PA.

## Stato

**Progettazione / PoC — non servizio istituzionale.**

Il deployment reale dei nodi e qualsiasi collegamento a infrastrutture di Comune, Diocesi, Hera o organizzatori richiede autorizzazione esplicita.
