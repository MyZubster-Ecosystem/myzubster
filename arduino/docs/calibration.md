# Calibrazione sensori pH e EC

Questa guida descrive la procedura di calibrazione a due punti per i sensori pH e EC analogici (es. Gravity pH/EC).

## Premessa
- Eseguire la calibrazione a temperatura ambiente stabile (20-25 °C).
- Usare soluzioni buffer fresche e chiudere i flaconi dopo l'uso.
- Sciacquare l'elettrodo con acqua distillata prima di ogni passaggio.

## 1. Calibrazione pH (due punti)

### Soluzioni buffer consigliate
- **Punto basso:** pH 4.00 o pH 7.00 (a seconda del range di lavoro).
- **Punto alto:** pH 7.00 o pH 10.01.

Per orti idroponici consigliati:
- Basso: pH 4.00
- Alto:  pH 7.00

### Procedura
1. Collegare il sensore pH e alimentarlo per almeno 10 minuti prima della calibrazione.
2. Immergere l'elettrodo nella soluzione a pH basso (es. pH 4.00) e attendere la stabilizzazione (1-2 minuti).
3. Leggere il valore raw da `Serial Monitor` o registrare l'output dello sketch di calibrazione.
4. Immergere l'elettrodo nella soluzione a pH alto (es. pH 7.00) e ripetere.
5. Calcolare l'offset di calibrazione e aggiornare la costante `PH_OFFSET` nello sketch.

### Esempio calcolo offset
Se il sensore legge pH 3.75 a pH 4.00 e pH 6.85 a pH 7.00:

```
Slope = (7.00 - 4.00) / (6.85 - 3.75) = 1.19
Offset medio = (pH_actual_low - measured_low + pH_actual_high - measured_high) / 2
```

Nel codice usare l'offset calcolato come `PH_OFFSET`.

## 2. Calibrazione EC (due punti)

### Soluzioni consigliate
- **Bassa conducibilità:** ~0.5 mS/cm (es. NaCl diluito o soluzione standard 1413 uS/cm = 1.413 mS/cm).
- **Alta conducibilità:** ~2.0 mS/cm o 12.88 mS/cm a seconda del range.

### Procedura
1. Sciacquare l'elettrodo EC con acqua distillata e asciugare.
2. Immergere nella soluzione a EC basso, leggere il raw ADC.
3. Immergere nella soluzione a EC alto, leggere il raw ADC.
4. Calcolare il fattore di scala `EC_K` che mappa l'ADC nel valore EC target.

### Esempio calcolo EC_K
Se a 1.413 mS/cm il raw ADC corrisponde a 2.05V:

```
EC_K = EC_target / voltage
```

Oppure tramite retta di calibrazione lineare tra due punti.

## 3. Tabella di registrazione calibrazione

Compilare durante la calibrazione:

| Data       | Sensore | Soluzione | Valore target | Raw ADC | Tensione (V) | Valore letto | Note              |
|------------|---------|-----------|---------------|---------|--------------|--------------|-------------------|
| 2026-07-31 | pH      | 4.00      | 4.00          |         |              |              |                   |
| 2026-07-31 | pH      | 7.00      | 7.00          |         |              |              |                   |
| 2026-07-31 | EC      | 1.413 mS  | 1.413         |         |              |              |                   |
| 2026-07-31 | EC      | 12.88 mS  | 12.88         |         |              |              |                   |

## 4. Note e best practice
- Ripetere la calibrazione ogni 2-4 settimane.
- Conservare l'elettrodo pH umido (soluzione di conservazione KCl 3M o acqua distillata secondo il produttore).
- Evitare di asciugare l'elettrodo pH all'aria per periodi prolungati.
- Per l'EC, pulire l'elettrodo con soluzione leggera di acido cloridrico se si osserva incrostazione.
