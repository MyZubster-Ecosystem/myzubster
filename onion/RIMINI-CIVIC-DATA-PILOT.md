# MyZubster Civic Data Gateway — Rimini Pilot

## Stato

Proposta di proof-of-concept indipendente. Non rappresenta un'integrazione ufficiale con il Comune di Rimini e non presuppone accesso a sistemi comunali interni.

## Obiettivo

Dimostrare che un dataset pubblico già esposto dal Comune può essere consumato, verificato e reso disponibile tramite un'infrastruttura MyZubster distribuita, senza trattare dati personali.

## Principi

- usare esclusivamente dati pubblici e non personali nella prima fase;
- rispettare licenza e termini del dataset sorgente;
- non modificare la fonte ufficiale;
- mantenere il Comune come source of truth;
- distinguere chiaramente copia/cache MyZubster e dato ufficiale;
- non introdurre dipendenze obbligatorie per i servizi comunali;
- nessuna modifica ai sistemi comunali senza autorizzazione formale.

## Fasi

### P0 — Selezione dataset

- [ ] scegliere un dataset pubblico a basso rischio;
- [ ] verificare licenza e modalità di accesso;
- [ ] documentare endpoint/API o download ufficiale;
- [ ] definire schema normalizzato;
- [ ] definire frequenza di aggiornamento;
- [ ] definire checksum/versioning.

### P1 — Prototype

- [ ] implementare importer read-only;
- [ ] registrare origine e timestamp del dato;
- [ ] verificare integrità;
- [ ] esporre API MyZubster read-only;
- [ ] containerizzare il gateway;
- [ ] documentare mapping source -> MyZubster.

### P2 — Distribuzione

- [ ] eseguire almeno due istanze indipendenti;
- [ ] aggiungere health monitoring;
- [ ] aggiungere discovery dei gateway;
- [ ] mantenere la fonte comunale come autorità primaria;
- [ ] verificare che un'istanza possa essere rimossa senza interrompere il servizio MyZubster.

### P3 — Demo tecnica

- [ ] acquisire un dataset pubblico;
- [ ] verificare versione/checksum;
- [ ] renderlo disponibile tramite i nodi MyZubster;
- [ ] interrompere volontariamente un nodo MyZubster;
- [ ] dimostrare il failover verso il nodo rimanente;
- [ ] verificare che il dato non venga alterato;
- [ ] produrre un breve report tecnico.

### P4 — Eventuale interlocuzione istituzionale

- [ ] preparare una scheda tecnica di massimo 2 pagine;
- [ ] descrivere architettura e benefici;
- [ ] indicare esplicitamente limiti e responsabilità;
- [ ] proporre un pilot non invasivo;
- [ ] chiedere un referente tecnico competente;
- [ ] concordare formalmente dataset, API, sicurezza e modalità di test prima di qualsiasi integrazione.

## Architettura target

```text
Comune / fonte Open Data
          |
          | read-only
          v
   Civic Data Importer
          |
     integrity check
          |
          v
   +------+------+
   |             |
 Gateway A     Gateway B
   |             |
   +------+------+
          |
      Discovery
          |
       Clients
```

## Criteri di successo

1. Il dataset proviene esclusivamente dalla fonte pubblica scelta.
2. L'origine e la versione del dato sono verificabili.
3. Nessun dato personale viene trattato nel PoC.
4. La perdita di un gateway MyZubster non interrompe la disponibilità del PoC.
5. Il PoC non modifica né sostituisce la fonte ufficiale.
6. Tutte le integrazioni istituzionali restano subordinate ad autorizzazione e accordi formali.

## Prossima azione

Selezionare un primo dataset pubblico del Comune di Rimini e implementare P0 prima di costruire qualsiasi collegamento con sistemi comunali non pubblici.
