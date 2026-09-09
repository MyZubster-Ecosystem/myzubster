# LIFE Partner Roles & Governance — Hospital AHP/PAP

Status: `PROPOSED / READY FOR PARTNER VALIDATION`

## Obiettivo
Definire ruoli, responsabilità e confini decisionali del pilot.

## Ruoli proposti
### Pilot owner / struttura sanitaria
- autorizza il perimetro del pilot;
- conferma il processo reale;
- definisce accesso ai dati;
- presidia privacy e operatività locale.

### Waste/logistics operator
- conferma modalità di raccolta, pesatura e trasporto;
- fornisce riferimenti operativi e documentali autorizzati;
- segnala anomalie logistiche.

### Treatment/recycling operator
- conferma ricezione, trattamento e output recuperati;
- rende disponibili evidenze e dati concordati;
- supporta i controlli incrociati.

### Scientific/MRV reviewer
- valida KPI, metodo, baseline, qualità dati e limiti;
- definisce criteri di verifica;
- segnala rischi di overclaim/greenwashing.

### MyZubster technical maintainer
- implementa data model, API, Evidence Layer, dashboard e audit trail;
- mantiene separati dati pubblici e privati;
- non sostituisce validazione scientifica o responsabilità di dominio.

### GitHub contributors
- contribuiscono a task tecnici delimitati;
- non diventano automaticamente partner LIFE;
- lavorano solo su dati pubblici, sintetici o autorizzati.

## Governance proposta
- decisioni di dominio: pilot owner + partner competenti;
- decisioni MRV: reviewer scientifico/MRV + owner;
- decisioni tecniche: maintainers MyZubster con review aperta;
- pubblicazione di claim: solo dopo verifica e consenso appropriato.

## RACI minimo
| Attività | Pilot owner | Logistics | Plant | MRV reviewer | MyZubster |
|---|---|---|---|---|---|
| processo reale | A/R | C | C | C | I |
| schema dati | C | C | C | C | A/R |
| KPI/MRV | C | I | C | A/R | C |
| raccolta evidenze | A | R | R | C | C |
| verifica | C | C | C | A/R | C |
| dashboard/report | C | I | I | C | A/R |

A=Accountable, R=Responsible, C=Consulted, I=Informed.

## Nota
Nessun ente o persona è considerato assegnato a questi ruoli finché non conferma esplicitamente la partecipazione.