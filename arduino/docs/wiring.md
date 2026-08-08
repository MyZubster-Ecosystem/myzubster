# Guida di cablaggio

Questa guida mostra i collegamenti per due configurazioni comuni:
- **Arduino Uno** (ATmega328P, 5V)
- **ESP32 DevKit** (3.3V)

## Componenti usati negli esempi

- Sensore pH analogico (Gravity pH Sensor o compatibile)
- Sensore EC analogico (Gravity EC Sensor o compatibile)
- DHT22 (temperatura e umidità)
- Relè 1 canale (per controllo pompa)
- Pompa per acqua 5V o 12V (a seconda del relè)

## 1. Arduino Uno (5V)

```
                         +-----------------+
                         |    Arduino Uno  |
                         |                 |
                         |                 |
          pH Sensor ---- | A0              |
                         |                 |
          EC Sensor ---- | A1              |
                         |                 |
          DHT22   DATA --| D2              |
                         |                 |
          DHT22   VCC ---| 5V              |
          DHT22   GND ---| GND             |
                         |                 |
          Relè    IN ----| D7              |
                         |                 |
          Relè   VCC ----| 5V              |
          Relè   GND ----| GND             |
                         |                 |
          Pompa  COM ----| Relè COM        |
          Pompa  NO  ----| Relè NO         |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### Note per Arduino Uno
- L'ADC è a 10 bit (0-1023) con riferimento 5V.
- Se il sensore pH/EC lavora a 3.3V, adattare il partitore o usare l'uscita 3.3V se supportata dal sensore.
- Il relè è attivo basso o attivo alto a seconda del modulo; verificare la logica del modulo specifico.

## 2. ESP32 DevKit (3.3V)

```
                         +-----------------+
                         |     ESP32       |
                         |                 |
                         |                 |
          pH Sensor ---- | GPIO36 (VP) A0  |
                         |                 |
          EC Sensor ---- | GPIO39 (VN) A1  |
                         |                 |
          DHT22   DATA --| GPIO4 (D2)      |
                         |                 |
          DHT22   VCC ---| 3V3             |
          DHT22   GND ---| GND             |
                         |                 |
          Relè    IN ----| GPIO5 (D5)      |
                         |                 |
          Relè   VCC ----| 3V3 / VIN       |
          Relè   GND ----| GND             |
                         |                 |
          Pompa  COM ----| Relè COM        |
          Pompa  NO  ----| Relè NO         |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### Note per ESP32
- I canali ADC1 (GPIO32-39) sono preferiti per letture analogiche stabili.
- `analogRead` su ESP32 restituisce 12 bit (0-4095) di default; regolare la tensione di riferimento se necessario.
- Alcuni moduli relè funzionano a 5V; verificare che l'ingresso logico sia tollerante 3.3V o usare un transistor di interfaccia.
- Non alimentare sensori a 5V dai pin 3V3 se il sensore richiede corrente superiore a ~50mA.

## 3. Schema a blocchi generale

```
[Sensore pH] ---> [ADC] ---> [MCU] ---> [Serial / WiFi] ---> [Cloud]
[Sensore EC] ---> [ADC] ---> [MCU]
[DHT22]     ---> [Digital] -> [MCU]
[Relè]     <--- [Digital] <--- [MCU] ---> [Pompa]
```

## 4. Sensore capacitivo umidità suolo

### Arduino Uno (5V)

```
                         +-----------------+
                         |    Arduino Uno  |
                         |                 |
                         |                 |
          Moisture ---- | A0              |
                         |                 |
          Moisture VCC -| 5V              |
          Moisture GND -| GND             |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### ESP32 DevKit (3.3V)

```
                         +-----------------+
                         |     ESP32       |
                         |                 |
                         |                 |
          Moisture ---- | GPIO36 (VP)     |
                         |                 |
          Moisture VCC -| 3V3             |
          Moisture GND -| GND             |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### Note
- Il sensore capacitivo restituisce un valore analogico che diminuisce all'aumentare dell'umidità.
- Calibrare i valori `DRY_VALUE` e `WET_VALUE` secondo il proprio sensore.
- Evitare di immergere completamente la parte sensibile oltre la linea indicata dal produttore.

## 5. Sensore di luce LDR (fotoresistore)

### Arduino Uno (5V)

```
                         +-----------------+
                         |    Arduino Uno  |
                         |                 |
                         |                 |
          LDR    A0 ----| A0              |
                         |                 |
          LDR   VCC ----| 5V              |
          LDR   GND ----| GND             |
                         |                 |
          R10k  A0 ----| A0 (partitore)  |
          R10k  GND ----| GND             |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### ESP32 DevKit (3.3V)

```
                         +-----------------+
                         |     ESP32       |
                         |                 |
                         |                 |
          LDR    A0 ----| GPIO36 (VP)     |
                         |                 |
          LDR   VCC ----| 3V3             |
          LDR   GND ----| GND             |
                         |                 |
          R10k  A0 ----| GPIO36 (partitore)
          R10k  GND ----| GND             |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### Note
- Configurazione partitore di tensione: VCC -> LDR -> A0 -> resistenza 10kΩ -> GND.
- Su ESP32 la lettura analogica è a 12 bit; lo sketch usa `analogReadResolution(10)` per coerenza.
- La curva lux/ADC è approssimativa; calibrare le costanti `LUX_K` e `LUX_EXPONENT` con un luxmetro.

## 6. Sensore pressione BMP180

### Arduino Uno (5V)

```
                         +-----------------+
                         |    Arduino Uno  |
                         |                 |
                         |                 |
          BMP180 SDA ----| A4              |
          BMP180 SCL ----| A5              |
                         |                 |
          BMP180 VCC ----| 3V3             |  <-- NON usare 5V!
          BMP180 GND ----| GND             |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### ESP32 DevKit (3.3V)

```
                         +-----------------+
                         |     ESP32       |
                         |                 |
                         |                 |
          BMP180 SDA ----| GPIO21 (SDA)    |
          BMP180 SCL ----| GPIO22 (SCL)    |
                         |                 |
          BMP180 VCC ----| 3V3             |  <-- NON usare 5V!
          BMP180 GND ----| GND             |
                         |                 |
          Alim. 5V/12V ---| VIN / 5V        |
                         +-----------------+
```

### Note
- Il BMP180 comunica via I2C. Su ESP32 l'I2C hardware usa GPIO21 (SDA) e GPIO22 (SCL) di default.
- Alimentare il sensore a 3.3V: l'alimentazione a 5V può danneggiarlo.
- Verificare l'indirizzo I2C con uno scanner se il sensore non viene rilevato.
- In caso di interferenze, aggiungere resistenze di pull-up (4.7kΩ) su SDA e SCL.

## 7. Linee guida di isolamento
- Usare cavi schermati per i segnali analogici (pH/EC/umidità/LDR) se i cavi superano i 20-30 cm.
- Separare le alimentazioni di potenza (pompa) da quelle di segnale (sensori) se possibile.
- Inserire un condensatore di filtro (100nF - 1uF) tra VCC e GND vicino ai sensori analogici per ridurre il rumore.
- Per l'I2C, mantenere le linee SDA/SCL corte (< 30 cm) e usare terminazioni se necessario.
