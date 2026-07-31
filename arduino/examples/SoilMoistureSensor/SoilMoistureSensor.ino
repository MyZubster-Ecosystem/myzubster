/**
 * SoilMoistureSensor.ino
 *
 * Lettura di un sensore di umidità del suolo capacitivo (analogico).
 * Converte il valore ADC in percentuale di umidità tramite calibrazione a due punti.
 * Supporta output Serial Monitor e, opzionalmente, upload WiFi verso MyZubster API.
 *
 * Wiring:
 *   - Sensore capacitivo umidità suolo -> A0
 *   - (opzionale) DHT22 temperatura -> D2
 *
 * Librerie richieste:
 *   - WiFi (inclusa nel core ESP32)
 *   - HTTPClient (inclusa nel core ESP32)
 *   - ArduinoJson (v6.x o v7.x)
 *   - DHT sensor library (Adafruit) — opzionale
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
#include <DHT.h>

// ==================== WIFI & API ====================
// REPLACE WITH YOUR OWN
const char* WIFI_SSID     = "REPLACE_WITH_YOUR_SSID";
const char* WIFI_PASSWORD = "REPLACE_WITH_YOUR_PASSWORD";
const char* API_ENDPOINT  = "https://api.myzubster.example/v1/sensors";
const char* DEVICE_ID     = "REPLACE_WITH_YOUR_DEVICE_ID";

// ==================== PIN ====================
const uint8_t PIN_MOISTURE = A0;
const uint8_t PIN_DHT      = 2;   // opzionale

// ==================== CALIBRAZIONE ====================
// Punto 1: aria asciutta (valore ADC maggiore)
// Punto 2: immerso in acqua (valore ADC minore)
// ESP32 12-bit (0-4095), ESP8266/UNO 10-bit (0-1023)
#if defined(ESP32)
  const int DRY_VALUE   = 3200;   // ADC in aria
  const int WET_VALUE   = 1200;   // ADC in acqua
  const int ADC_MAX     = 4095;
#else
  const int DRY_VALUE   = 800;    // ADC in aria (0-1023)
  const int WET_VALUE   = 300;    // ADC in acqua
  const int ADC_MAX     = 1023;
#endif

// ==================== PARAMETRI ====================
const unsigned long READ_INTERVAL_MS    = 2000UL;
const unsigned long UPLOAD_INTERVAL_MS  = 30000UL;
const uint8_t MAX_RETRIES              = 3;
const uint16_t RETRY_DELAY_MS          = 2000;

// ==================== DHT OPZIONALE ====================
#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// ==================== UTILITY ====================
float readMoisturePercent() {
  int raw = analogRead(PIN_MOISTURE);
  // Mappa linearmente [WET_VALUE, DRY_VALUE] -> [100%, 0%]
  float percent = (float)(DRY_VALUE - raw) / (float)(DRY_VALUE - WET_VALUE) * 100.0;
  if (percent < 0.0)   percent = 0.0;
  if (percent > 100.0) percent = 100.0;
  return percent;
}

float readTemperature() {
#if defined(ESP32)
  return dht.readTemperature();
#else
  return dht.readTemperature();
#endif
}

float readHumidity() {
#if defined(ESP32)
  return dht.readHumidity();
#else
  return dht.readHumidity();
#endif
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
bool uploadSensorData(float moisture, float tempC, float hum) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("WiFi non connesso."));
    return false;
  }

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = (uint32_t)(millis() / 1000UL);

  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["soil_moisture"] = roundf(moisture * 100.0) / 100.0;
  if (!isnan(tempC)) sensors["temperature"] = roundf(tempC * 10.0) / 10.0;
  if (!isnan(hum))   sensors["humidity"]    = roundf(hum   * 10.0) / 10.0;

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
void printRow(float moisture, float tempC, float hum) {
  Serial.print(F("Umidita' suolo: "));
  Serial.print(moisture, 1);
  Serial.print(F(" %\t"));

  if (!isnan(tempC)) {
    Serial.print(F("T: "));
    Serial.print(tempC, 1);
    Serial.print(F(" C\t"));
  } else {
    Serial.print(F("T: N/A\t"));
  }

  if (!isnan(hum)) {
    Serial.print(F("H: "));
    Serial.print(hum, 0);
    Serial.print(F(" %"));
  } else {
    Serial.print(F("H: N/A"));
  }

  Serial.println();
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

#if defined(ESP32)
  analogReadResolution(12);
#endif
  dht.begin();

  // Connessione WiFi (commentare per modalità solo Serial)
  // connectWiFi();

  delay(500);
  Serial.println(F("\n=== MyZubster SoilMoistureSensor ==="));
}

// ==================== LOOP ====================
void loop() {
  static unsigned long lastRead = 0;
  static unsigned long lastUpload = 0;
  unsigned long now = millis();

  if (now - lastRead >= READ_INTERVAL_MS) {
    lastRead = now;

    float moisture = readMoisturePercent();
    float tempC = readTemperature();
    float hum = readHumidity();

    printRow(moisture, tempC, hum);

    // Upload periodico (solo se WiFi connesso)
    if (WiFi.status() == WL_CONNECTED && now - lastUpload >= UPLOAD_INTERVAL_MS) {
      lastUpload = now;
      bool ok = uploadSensorData(moisture, tempC, hum);
      Serial.println(ok ? F("Upload completato.") : F("Upload fallito."));
    }
  }

  delay(100);
}
