/**
 * WifiUpload.ino
 *
 * Esempio di connessione WiFi su ESP32 e invio dati di sensori a MyZubster API.
 * Usa HTTPClient + ArduinoJson per il payload JSON.
 *
 * Wiring:
 *   - pH sensor   -> A0
 *   - EC sensor   -> A1
 *   - Temperatura -> DHT22 su pin 2
 *
 * Dipendenze:
 *   - WiFi (inclusa nel core ESP32)
 *   - HTTPClient (inclusa nel core ESP32)
 *   - ArduinoJson (v6.x o v7.x)
 *   - DHT sensor library (Adafruit)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==================== WIFI & API ====================
// REPLACE WITH YOUR OWN
const char* WIFI_SSID     = "REPLACE_WITH_YOUR_SSID";
const char* WIFI_PASSWORD = "REPLACE_WITH_YOUR_PASSWORD";

// Endpoint API MyZubster
// REPLACE WITH YOUR OWN: sostituire con il proprio endpoint produzione
const char* API_ENDPOINT  = "https://api.myzubster.example/v1/sensors";
const char* DEVICE_ID     = "REPLACE_WITH_YOUR_DEVICE_ID";

// ==================== PIN SENSORI ====================
const uint8_t PIN_PH  = A0;
const uint8_t PIN_EC  = A1;
const uint8_t PIN_DHT = 2;

#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// ==================== COEFFICIENTI ====================
const float PH_OFFSET     = 0.0;
const float EC_K           = 1.0;
const float PH_TEMP_COEFF  = 0.03;

// ==================== PARAMETRI INVIO ====================
const unsigned long UPLOAD_INTERVAL_MS = 30000UL;   // 30 secondi
const uint8_t MAX_RETRIES = 3;
const uint16_t RETRY_DELAY_MS = 2000;

// ==================== LETTURE SENSORI ====================
float readPH() {
  int raw = analogRead(PIN_PH);
  float voltage = raw * (3.3 / 1023.0);
  float ph = 7.0 - ((voltage - 2.5) / 0.18) + PH_OFFSET;
  return ph;
}

float readEC() {
  int raw = analogRead(PIN_EC);
  float voltage = raw * (3.3 / 1023.0);
  float ec = (voltage - 1.0) * EC_K;
  if (ec < 0.0) ec = 0.0;
  return ec;
}

float compensatePH(float ph, float tempC) {
  if (isnan(tempC)) return ph;
  return ph + PH_TEMP_COEFF * (25.0 - tempC);
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

// ==================== INVIO DATI ====================
bool uploadSensorData(float ph, float ec, float tempC, float hum) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("WiFi non connesso."));
    return false;
  }

  // Costruzione JSON
  // Se si usa ArduinoJson v7, l'allocazione è dinamica; qui usiamo v6-style per semplicità.
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = (uint32_t)(millis() / 1000UL);

  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["ph"] = roundf(ph * 100.0) / 100.0;
  sensors["ec"] = roundf(ec * 100.0) / 100.0;
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

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

  dht.begin();
  analogReadResolution(10);

  connectWiFi();

  delay(1000);
  Serial.println(F("\n=== MyZubster WifiUpload ==="));
}

// ==================== LOOP ====================
void loop() {
  static unsigned long lastUpload = 0;
  unsigned long now = millis();

  if (now - lastUpload >= UPLOAD_INTERVAL_MS) {
    lastUpload = now;

    float ph = readPH();
    float ec = readEC();
    float tempC = dht.readTemperature();
    float hum = dht.readHumidity();

    if (!isnan(tempC)) {
      ph = compensatePH(ph, tempC);
    }

    Serial.print(F(" Letti -> pH: "));
    Serial.print(ph, 2);
    Serial.print(F(" EC: "));
    Serial.print(ec, 2);
    Serial.print(F(" T: "));
    Serial.print(tempC, 1);
    Serial.print(F(" H: "));
    Serial.println(hum, 0);

    bool ok = uploadSensorData(ph, ec, tempC, hum);
    Serial.println(ok ? F("Upload completato.") : F("Upload fallito."));
  }

  delay(1000);
}
