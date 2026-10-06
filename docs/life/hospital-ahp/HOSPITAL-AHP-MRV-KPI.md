# Hospital AHP MRV / KPI

Status: `PROPOSED PILOT / READY FOR VALIDATION`

## Obiettivo
Definire indicatori semplici e auditabili per collegare pesatura, trasporto, ricezione, trattamento e recupero materiali.

## KPI candidati

1. **kg pre-trasporto**
   - somma dei `net_weight_kg` degli eventi `pre_transport_weighing`

2. **kg ricevuti all'impianto**
   - somma dei pesi di ingresso associati agli stessi lotti/contenitori

3. **scostamento peso %**
   - `(peso_impianto - peso_pre_trasporto) / peso_pre_trasporto * 100`
   - da calcolare solo su record accoppiati correttamente

4. **kg trattati**
   - quantità effettivamente avviata al trattamento

5. **kg materiali recuperati**
   - somma delle frazioni recuperate documentate

6. **resa di recupero %**
   - `kg_recuperati / kg_trattati * 100`

7. **coverage evidenze %**
   - percentuale di eventi con documento/provenienza sufficiente

8. **cross-check coverage %**
   - percentuale di lotti con confronto pre-trasporto ↔ ingresso impianto

## Regole MRV minime
Per ogni KPI devono essere indicati:
- source event
- unità
- formula
- frequenza di calcolo
- owner/responsabile
- criterio di validazione
- qualità minima dei dati
- eventuali esclusioni

## Livelli evidenza
- `DECLARED`
- `MEASURED`
- `DOCUMENTED`
- `CROSS_CHECKED`
- `VERIFIED`

Un KPI non deve essere presentato come verificato se i record sottostanti non soddisfano il livello richiesto.

## Rischi da evitare
- contare due volte lo stesso lotto
- confrontare pesi riferiti a lotti diversi
- confondere peso raccolto con peso effettivamente trattato
- confondere materiale trattato con materiale recuperato
- trasformare stime o dichiarazioni in misure verificate
