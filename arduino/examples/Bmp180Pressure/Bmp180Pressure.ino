/**
 * Bmp180Pressure.ino
 *
 * Lettura di pressione e temperatura dal sensore BMP180 (o BMP085) su bus I2C.
 * Usa la libreria Adafruit BMP085/BMP180. Invia dati a MyZubster API via WiFi (ESP32).
 * Supporta anche output Serial Monitor per debug.
 *
 * Wiring:
 *   - BMP180 VCC -> 3V3 (non usare 5V!)
 *   - BMP180 GND -> GND
 *   - BMP180 SDA -> GPIO21 (ESP32) / A4 (Uno)
 *   - BMP180 SCL -> GPIO22 (ESP32) / A5 (Uno)
 *
 * Librerie richieste:
 *   - Adafruit BMP085 Library (include Wire.h)
 *   - WiFi (inclusa nel core ESP32)
 *   - HTTPClient (inclusa nel core ESP32)
 *   - ArduinoJson (v6.x o v7.x)
 */

#include <Arduino.h>
#if defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
#elif defined(ESP32)
  #include <WiFi.h>
  #include <HTTPClient.h>
#else
  #error "Questo esempio supporta solo ESP8266 e ESP32."
#endif

#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>

// ==================== WIFI & API ====================
// REPLACE WITH YOUR OWN
const char* WIFI_SSID     = "REPLACE_WITH_YOUR_SSID";
const char* WIFI_PASSWORD = "REPLACE_WITH_YOUR_PASSWORD";
const char* API_ENDPOINT  = "https://api.myzubster.example/v1/sensors";
const char* DEVICE_ID     = "REPLACE_WITH_YOUR_DEVICE_ID";

// ==================== PIN & I2C ====================
// Su ESP32: SDA=GPIO21, SCL=GPIO22 (default). Su Uno: SDA=A4, SCL=A5.
// Nessun pin digitale specifico per BMP180; usa I2C hardware.

// ==================== PARAMETRI ====================
const unsigned long READ_INTERVAL_MS    = 2000UL;
const unsigned long UPLOAD_INTERVAL_MS  = 30000UL;
const uint8_t MAX_RETRIES              = 3;
const uint16_t RETRY_DELAY_MS          = 2000;

// ==================== SENSORE ====================
Adafruit_BMP085 bmp;
bool sensorOK = false;

// ==================== UTILITY ====================
bool initBMP180() {
  if (!bmp.begin()) {
    Serial.println(F("Errore: sensore BMP180 non rilevato. Verificare cablaggio e indirizzo I2C."));
    sensorOK = false;
    return false;
  }
  Serial.println(F("BMP180 inizializzato."));
  sensorOK = true;
  return true;
}

float readPressureHPa() {
  float pressurePa = bmp.readPressure();
  return pressurePa / 100.0;  // Pa -> hPa
}

float readTemperatureC() {
  return bmp.readTemperature();
}

// ==================== WIFI ====================
void connectWiFi() {
  Serial.print(F("Connessione a WiFi "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint8_t attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("WiFi connesso. IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("Connessione WiFi fallita. Riavviare."));
  }
}

// ==================== UPLOAD ====================
bool uploadSensorData(float pressure, float tempC) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("WiFi non connesso."));
    return false;
  }

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = (uint32_t)(millis() / 1000UL);

  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["pressure"]      = roundf(pressure * 100.0) / 100.0;   // hPa
  sensors["temperature"]   = roundf(tempC    * 10.0) / 10.0;    // °C

  char buffer[256];
  size_t len = serializeJson(doc, buffer);

  HTTPClient http;
  http.setTimeout(10000);
  http.begin(API_ENDPOINT);
  http.addHeader(F("Content-Type"), F("application/json"));

  uint8_t attempt = 0;
  bool success = false;
  int httpCode = 0;

  while (attempt < MAX_RETRIES && !success) {
    if (attempt > 0) {
      Serial.print(F("Retry #"));
      Serial.println(attempt);
      delay(RETRY_DELAY_MS);
    }
    httpCode = http.POST((uint8_t*)buffer, len);

    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED || httpCode == HTTP_CODE_ACCEPTED) {
        success = true;
        Serial.print(F("Upload OK, codice: "));
        Serial.println(httpCode);
      } else {
        Serial.print(F("Upload errore HTTP: "));
        Serial.println(httpCode);
      }
    } else {
      Serial.print(F("Upload fallito, errore connessione: "));
      Serial.println(http.errorToString(httpCode));
    }
    attempt++;
  }

  http.end();
  return success;
}

// ==================== STAMPA ====================
void printRow(float pressure, float tempC) {
  Serial.print(F("Pressione: "));
  Serial.print(pressure, 1);
  Serial.print(F(" hPa\t"));

  Serial.print(F("Temperatura: "));
  Serial.print(tempC, 1);
  Serial.println(F(" C"));
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

  Wire.begin();

  if (!initBMP180()) {
    Serial.println(F("Attendere 5 secondi e riavviare se il sensore non viene trovato."));
    delay(5000);
  }

  // Connessione WiFi (commentare per modalità solo Serial)
  // connectWiFi();

  delay(500);
  Serial.println(F("\n=== MyZubster Bmp180Pressure ==="));
}

// ==================== LOOP ====================
void loop() {
  static unsigned long lastRead = 0;
  static unsigned long lastUpload = 0;
  static unsigned long lastRetry = 0;
  unsigned long now = millis();

  if (!sensorOK) {
    if (now - lastRetry >= 10000UL) {
      lastRetry = now;
      sensorOK = initBMP180();
      if (sensorOK) {
        Serial.println(F("BMP180 inizializzato con successo."));
      } else {
        Serial.println(F("BMP180 non rilevato, riprovo tra 10s..."));
      }
    }
    delay(100);
    return;
  }

  if (now - lastRead >= READ_INTERVAL_MS) {
    lastRead = now;

    float pressure = readPressureHPa();
    float tempC = readTemperatureC();

    printRow(pressure, tempC);

    if (WiFi.status() == WL_CONNECTED && now - lastUpload >= UPLOAD_INTERVAL_MS) {
      lastUpload = now;
      bool ok = uploadSensorData(pressure, tempC);
      Serial.println(ok ? F("Upload completato.") : F("Upload fallito."));
    }
  }

  delay(100);
}
