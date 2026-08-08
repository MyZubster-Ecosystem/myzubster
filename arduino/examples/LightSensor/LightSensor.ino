/**
 * LightSensor.ino
 *
 * Lettura di un sensore di luce LDR (fotoresistore) su ingresso analogico.
 * Converte la tensione letta in lux approssimati tramite curva di calibrazione.
 * Supporta Serial Monitor e upload WiFi opzionale verso MyZubster API.
 *
 * Wiring:
 *   - LDR -> A0 (partitore con resistenza 10kΩ: VCC -> LDR -> A0 -> 10kΩ -> GND)
 *
 * Librerie richieste:
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

// ==================== WIFI & API ====================
// REPLACE WITH YOUR OWN
const char* WIFI_SSID     = "REPLACE_WITH_YOUR_SSID";
const char* WIFI_PASSWORD = "REPLACE_WITH_YOUR_PASSWORD";
const char* API_ENDPOINT  = "https://api.myzubster.example/v1/sensors";
const char* DEVICE_ID     = "REPLACE_WITH_YOUR_DEVICE_ID";

// ==================== PIN ====================
const uint8_t PIN_LDR = A0;

// ==================== CALIBRAZIONE ====================
// Modello semplificato: lux = K / (V_in / V_ref - offset)
// Oppure lux = K * pow(ADC, exponent) — qui usiamo la formula inversa del partitore.
//
// Per una fotocellula CdS comune:
//   - Lux ~ 0 con buio (ADC minimo)
//   - Lux ~ 1000 con luce intensa (ADC massimo)
//
// Costanti regolabili secondo il proprio LDR e partitore:
const float LUX_K        = 125000.0;   // guadagno
const float LUX_EXPONENT = -1.4;       // esponente empirico

#if defined(ESP32)
  const int ADC_MAX      = 4095;       // ESP32 12-bit
#else
  const int ADC_MAX      = 1023;       // UNO/ESP8266 10-bit
#endif

// ==================== PARAMETRI ====================
const unsigned long READ_INTERVAL_MS    = 2000UL;
const unsigned long UPLOAD_INTERVAL_MS  = 30000UL;
const uint8_t MAX_RETRIES              = 3;
const uint16_t RETRY_DELAY_MS          = 2000;

// ==================== UTILITY ====================
float readLux() {
  int raw = analogRead(PIN_LDR);
  // Evita divisione per zero
  if (raw < 1) raw = 1;

  // Formula empirica: lux = K * (ADC)^exponent
  float lux = LUX_K * pow((float)raw, LUX_EXPONENT);

  if (lux < 0.0)   lux = 0.0;
  if (lux > 100000.0) lux = 100000.0;  // saturazione

  return lux;
}

float readVoltage() {
  int raw = analogRead(PIN_LDR);
#if defined(ESP32)
  float voltage = raw * (3.3 / 4095.0);  // ESP32 12-bit
#else
  float voltage = raw * (3.3 / 1023.0);  // adattare a 5.0 se si usa UNO a 5V
#endif
  return voltage;
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
bool uploadSensorData(float lux, float voltage) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("WiFi non connesso."));
    return false;
  }

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = (uint32_t)(millis() / 1000UL);

  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["light_lux"] = roundf(lux * 100.0) / 100.0;
  sensors["light_voltage"] = roundf(voltage * 1000.0) / 1000.0;

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
void printRow(float lux, float voltage) {
  Serial.print(F("Luce: "));
  Serial.print(lux, 1);
  Serial.print(F(" lux\t"));

  Serial.print(F("V_in: "));
  Serial.print(voltage, 2);
  Serial.println(F(" V"));
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

#if defined(ESP32)
  analogReadResolution(12);
#endif

  // Connessione WiFi (commentare per modalità solo Serial)
  // connectWiFi();

  delay(500);
  Serial.println(F("\n=== MyZubster LightSensor ==="));
}

// ==================== LOOP ====================
void loop() {
  static unsigned long lastRead = 0;
  static unsigned long lastUpload = 0;
  unsigned long now = millis();

  if (now - lastRead >= READ_INTERVAL_MS) {
    lastRead = now;

    float lux = readLux();
    float voltage = readVoltage();

    // Controllo validità: se il sensore è scollegato, il valore raw tende a 0 o 1023
    int raw = analogRead(PIN_LDR);
    if (raw <= 5 || raw >= ADC_MAX - 5) {
      Serial.println(F("Attenzione: sensore luce probabilmente scollegato o guasto."));
    }

    printRow(lux, voltage);

    if (WiFi.status() == WL_CONNECTED && now - lastUpload >= UPLOAD_INTERVAL_MS) {
      lastUpload = now;
      bool ok = uploadSensorData(lux, voltage);
      Serial.println(ok ? F("Upload completato.") : F("Upload fallito."));
    }
  }

  delay(100);
}
