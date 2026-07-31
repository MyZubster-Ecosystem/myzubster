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

## 4. Linee guida di isolamento
- Usare cavi schermati per i segnali analogici (pH/EC) se i cavi superano i 20-30 cm.
- Separare le alimentazioni di potenza (pompa) da quelle di segnale (sensori) se possibile.
- Inserire un condensatore di filtro (100nF - 1uF) tra VCC e GND vicino ai sensori analogici per ridurre il rumore.
