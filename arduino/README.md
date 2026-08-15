# MyZubster Arduino Examples

Esempi di codice Arduino per progetti di orti intelligenti. Questo repository contiene sketch di esempio per la lettura di sensori pH/EC, la connessione WiFi e l'invio dati al cloud MyZubster.

## Struttura del progetto

```
arduino/
├── README.md
├── keywords.txt
├── examples/
│   ├── PhEcSensor/
│   │   └── PhEcSensor.ino
│   ├── WifiUpload/
│   │   └── WifiUpload.ino
│   ├── SerialDashboard/
│   │   └── SerialDashboard.ino
│   ├── SoilMoistureSensor/
│   │   └── SoilMoistureSensor.ino
│   ├── LightSensor/
│   │   └── LightSensor.ino
│   └── Bmp180Pressure/
│       └── Bmp180Pressure.ino
├── docs/
│   ├── wiring.md
│   └── calibration.md
└── components/
    └── components.md
```

## Quick start

### Schede supportate
- Arduino Uno / Nano (ATmega328P)
- ESP32 DevKit / NodeMCU-32S

### Configurazione IDE
1. Installare l'Arduino IDE 2.x o la versione 1.8.19+.
2. Installare la board ESP32 se si usa ESP32:
   - `File` → `Settings` → `Additional Boards Manager URLs` → aggiungere `https://dl.espressif.com/dl/package_esp32_index.json`
   - `Tools` → `Board` → `Boards Manager` → cercare `esp32` e installare.
3. Verificare che la porta COM sia corretta in `Tools` → `Port`.

### Librerie richieste
- `ArduinoJson` (by Benoit Blanchon) — v6.x o v7.x
- `DHT sensor library` (by Adafruit) — v1.4.x
- `Adafruit Unified Sensor` (dipendenza di DHT)
- `Adafruit BMP085 Library` (by Adafruit) — per sensore BMP180
- `HTTPClient` (inclusa nel core ESP32)
- `WiFi` (inclusa nel core ESP32 / AVR)

## Integrazione API MyZubster

Gli sketch inviano dati in formato JSON all'endpoint:

```
POST https://api.myzubster.example/v1/sensors
```

Sostituire l'URL con il proprio endpoint reale e configurare le credenziali nei campi contrassegnati con `REPLACE WITH YOUR OWN`.

Formato payload:

```json
{
  "device_id": "REPLACE_WITH_YOUR_DEVICE_ID",
  "sensors": {
    "ph": 6.5,
    "ec": 1.2,
    "temperature": 22.4,
    "humidity": 65.0,
    "soil_moisture": 42.3,
    "light_lux": 850.0,
    "light_voltage": 1.85,
    "pressure": 1013.25
  },
  "timestamp": 1690000000
}
```

## Disclaimer

Questo codice è fornito "così com'è" a scopo educativo. Verificare tensioni, correnti e isolamento prima di collegare sensori o attuatori in ambiente agricolo. L'autore non è responsabile per danni a persone, animali, piante o apparecchiature.
