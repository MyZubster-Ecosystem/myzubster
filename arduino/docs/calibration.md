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

## 3. Calibrazione sensore umidità suolo (due punti)

### Premessa
- Usare un sensore capacitivo (non resistivo) per maggiore durata.
- Pulire la sonda prima della calibrazione per rimuovere residui di terra.
- Attendere la stabilizzazione del valore ADC dopo ogni immersione (almeno 30 secondi).

### Soluzioni consigliate
- **Punto asciutto (DRY):** aria ambiente, sonda non a contatto con acqua.
- **Punto bagnato (WET):** immersa in acqua a temperatura ambiente (20-25 °C).

### Procedura
1. Collegare il sensore e alimentarlo.
2. Porre la sonda in aria asciutta e leggere il valore ADCmedio da Serial Monitor.
3. Immergere la sonda in acqua (fino alla linea indicata dal produttore) e leggere il nuovo valore ADC.
4. Calcolare `DRY_VALUE` e `WET_VALUE` come valor medi di 10 letture per ridurre il rumore.
5. Aggiornare le costanti nello sketch.

### Esempio
Se in aria si legge ~3200 e in acqua ~1200:

```
DRY_VALUE = 3200;
WET_VALUE = 1200;
```

La percentuale sarà calcolata come:
```
percent = (DRY_VALUE - raw) / (DRY_VALUE - WET_VALUE) * 100
```

## 4. Calibrazione sensore luce LDR

### Premessa
- La risposta di un LDR è non lineare; usare la formula empirica fornita o tararla con un luxmetro.
- Montare il partitore di tensione con una resistenza da 10kΩ per ottenere un range utile.

### Metodo 1: curve predefinite
- Utilizzare le costanti `LUX_K` e `LUX_EXPONENT` fornite come punto di partenza.
- Regolare `LUX_K` per adattare la scala e `LUX_EXPONENT` per la curvatura.

### Metodo 2: calibrazione a due punti con luxmetro
1. Porre il sensore in un ambiente a illuminazione nota (es. 0 lux al buio, 1000 lux sotto lampada).
2. Leggere il valore ADC corrispondente.
3. Calcolare `LUX_K` e `LUX_EXPONENT` risolvendo il sistema:
   ```
   lux1 = K * ADC1^exponent
   lux2 = K * ADC2^exponent
   ```
4. Inserire i valori nello sketch.

## 5. Tabella di registrazione calibrazione

Compilare durante la calibrazione:

| Data       | Sensore               | Condizione     | Valore ADC | Valore target | Costante aggiornata | Note              |
|------------|-----------------------|----------------|------------|---------------|---------------------|-------------------|
| 2026-07-31 | Umidità suolo         | Aria asciutta  |            | 0 %           | DRY_VALUE = ...     |                   |
| 2026-07-31 | Umidità suolo         | Acqua          |            | 100 %         | WET_VALUE = ...     |                   |
| 2026-07-31 | Luce LDR              | Buio           |            | 0 lux         |                     |                   |
| 2026-07-31 | Luce LDR              | 1000 lux       |            | 1000 lux      | LUX_K / EXPONENT    |                   |

## 6. Note e best practice
- Ripetere la calibrazione ogni 2-4 settimane per i sensori che subiscono drift.
- Conservare l'elettrodo pH umido (soluzione di conservazione KCl 3M o acqua distillata secondo il produttore).
- Evitare di asciugare l'elettrodo pH all'aria per periodi prolungati.
- Per l'EC, pulire l'elettrodo con soluzione leggera di acido cloridrico se si osserva incrostazione.
- Per l'LDR, proteggere il sensore da agenti atmosferici se usato all'esterno (cover trasparente UV-stabile).
