# Hospital Weighing Data Schema

Status: `PROPOSED PILOT / READY FOR VALIDATION`

## Evento principale
`pre_transport_weighing`

## Campi minimi proposti

```json
{
  "event_id": "evt-001",
  "container_or_batch_id": "AHP-LOT-001",
  "facility_ref": "hospital-site-ref",
  "waste_stream": "AHP_PAP",
  "gross_weight_kg": 0,
  "tare_weight_kg": 0,
  "net_weight_kg": 0,
  "scale_ref": "scale-001",
  "scale_calibration_ref": null,
  "timestamp": "ISO-8601",
  "operator_or_system_ref": "operator-or-system-ref",
  "pickup_or_transport_ref": null,
  "record_or_document_ref": null,
  "quality_status": "MEASURED",
  "visibility": "PRIVATE",
  "hash_or_signature": null
}
```

## Regole minime
- `net_weight_kg = gross_weight_kg - tare_weight_kg`
- tutti i pesi devono essere >= 0
- il timestamp deve essere presente
- `scale_ref` deve identificare la pesa o il sistema che ha prodotto la misura
- se presente, `record_or_document_ref` deve puntare a un documento/registro accessibile agli attori autorizzati
- `quality_status` non può essere `VERIFIED` senza regole di validazione definite dal pilot

## Stati qualità
- `DECLARED`
- `MEASURED`
- `DOCUMENTED`
- `CROSS_CHECKED`
- `VERIFIED`

## Confronto con ingresso impianto
Il record di pesatura pre-trasporto può essere confrontato con un evento `plant_received` contenente almeno:
- stesso `container_or_batch_id`
- peso in ingresso
- timestamp
- impianto
- documento/ricevuta

La differenza percentuale può essere calcolata solo quando i due record sono compatibili e riferiti allo stesso lotto/contenitore.

## Privacy
Nessun campo deve contenere dati sanitari, nomi di pazienti o informazioni personali non necessarie.
