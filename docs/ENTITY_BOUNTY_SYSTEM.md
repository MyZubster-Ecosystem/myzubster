# Canonical Entity Completion Bounties

Il programma `MYZ-ENTITY-COMPLETION-001` rende visibile e verificabile il lavoro necessario per completare le 12 entità AI canoniche e i relativi kit visuali.

Il registro sorgente è `frontend/src/data/entityBountyProgram.json`. Le entità provengono da `frontend/src/data/canonicalEntities.json`; le 24 bounty vengono derivate combinando ogni entità con due track standard.

## Track

| Track | Quantità | Reward proposto per entità | Scopo |
| --- | ---: | ---: | --- |
| `entity-completion` | 12 | 250 MYZ | Adozione nel repository, contratto, health check, test e collegamento all'hub |
| `visual-identity` | 12 | 150 MYZ | Avatar, hero, badge SVG, sorgenti, licenza e accessibilità |
| **Totale** | **24** | **4.800 MYZ** | Contabilità interna proposta, soggetta a verifica |

MYZ è un'unità interna di reward/accounting. Lo stato `PROPOSED` non è una riserva di fondi, non promette conversione o pagamento esterno e non attiva settlement automatico.

## Milestone di completamento

Ogni entità espone sei milestone:

1. profilo canonico;
2. API e chat;
3. README dedicato;
4. adozione nel repository dell'entità;
5. visual identity kit;
6. verifica finale.

Gli stati supportati sono:

- `COMPLETE`: esiste evidenza verificata;
- `IN_REVIEW`: il deliverable esiste ma la revisione non è conclusa;
- `OPEN`: lavoro ancora necessario.

La percentuale visuale assegna peso `1` a `COMPLETE`, `0,5` a `IN_REVIEW` e `0` a `OPEN`. Non equivale allo stato di deploy o production readiness.

## Flusso contributor

1. Aprire `/entity-bounties` oppure la scheda **Bounty & visual** in `/entities`.
2. Selezionare un'entità e leggere deliverable, criteri ed evidenze richieste.
3. Usare **Proponi su GitHub** per preparare una issue nel repository canonico dell'entità.
4. Attendere conferma di scope e assegnazione da parte del maintainer prima di iniziare lavoro ad alto costo.
5. Collegare issue, pull request, test e asset alla submission.
6. Ottenere almeno una revisione indipendente e l'approvazione di un maintainer.
7. Aggiornare il registro solo dopo che le evidenze sono verificabili.

L'apertura dell'issue non assegna automaticamente il lavoro o il reward.

## API pubblica

### Programma completo

```http
GET /api/entities/bounties
GET /api/entities/bounties?track=visual-identity
GET /api/entities/bounties?status=OPEN_FOR_PROPOSAL
```

La risposta include policy, riepilogo, completamento per entità e bounty filtrate.

### Singola entità

```http
GET /api/entities/:slug/bounties
```

La risposta include:

- percentuale e milestone;
- due bounty standard;
- reward MYZ proposto;
- deliverable;
- criteri di accettazione;
- evidenze richieste;
- URL GitHub precompilato per proporre il lavoro.

## Aggiornare lo stato

Modificare `entityOverrides` in `frontend/src/data/entityBountyProgram.json` senza alterare i default delle altre entità:

```json
{
  "entityOverrides": {
    "zorgax": {
      "milestones": {
        "visual-kit": "IN_REVIEW"
      },
      "tracks": {
        "visual-identity": "IN_REVIEW"
      }
    }
  }
}
```

Un override deve essere accompagnato nella stessa pull request dai link alle evidenze che giustificano il nuovo stato.

## Controlli obbligatori

- nessun segreto, PII o coordinata sensibile negli asset o nelle evidenze;
- provenienza e licenza esplicite per ogni visual;
- contrasto e alt text verificati;
- nessun uso di marchi o materiali senza licenza compatibile;
- nessuna affermazione di pagamento, deploy, partnership o impatto senza fonte verificabile;
- per attività di sicurezza, scope e autorizzazione scritti prima del lavoro.
