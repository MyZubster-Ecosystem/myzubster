/**
 * PhEcSensor.ino
 *
 * Lettura base di sensori pH e EC analogici (tipo Gravity pH/EC).
 * Output su Serial Monitor.
 *
 * Wiring:
 *   - pH sensor   -> A0
 *   - EC sensor   -> A1
 *   - Temperatura -> da sensore DHT22 su pin digitale 2 (opzionale)
 *
 * Librerie richieste:
 *   - DHT sensor library (Adafruit)
 *   - Adafruit Unified Sensor
 */

#include <Arduino.h>
#if defined(ESP32)
  #include <WiFi.h>
#else
  #include <WiFiNINA.h>
#endif

// ==================== CONFIGURAZIONE PIN ====================
const uint8_t PIN_PH   = A0;
const uint8_t PIN_EC   = A1;
const uint8_t PIN_DHT  = 2;   // DHT22 DATA

// ==================== COEFFICIENTI SENSORI ====================
// Questi valori sono indicativi; calibrarli secondo la scheda tecnica.
const float PH_OFFSET     = 0.0;   // offset di calibrazione pH
const float EC_K           = 1.0;   // fattore di scala EC
const float PH_TEMP_COEFF  = 0.03;  // compensazione pH per °C (tipico ~0.03 pH/°C)

// ==================== PARAMETRI LETTURA ====================
const unsigned long READ_INTERVAL_MS = 2000UL;

// ==================== DHT SETUP ====================
#include <DHT.h>
#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// ==================== UTILITY ====================
float readPH() {
  int raw = analogRead(PIN_PH);
  float voltage = raw * (3.3 / 1023.0);   // per ESP32 usare 3.3; per UNO 5.0 con 1023 ADC
  // Formula esemplificativa: pH = 7 - ((voltage - 2.5) / 0.18)
  float ph = 7.0 - ((voltage - 2.5) / 0.18) + PH_OFFSET;
  return ph;
}

float readEC() {
  int raw = analogRead(PIN_EC);
  float voltage = raw * (3.3 / 1023.0);
  // Formula esemplificativa: EC (mS/cm) = (voltage - offset) * K
  float ec = (voltage - 1.0) * EC_K;
  if (ec < 0.0) ec = 0.0;
  return ec;
}

float compensatePH(float ph, float tempC) {
  // Compensazione semplificata: pH misurato + slope * (25 - T)
  return ph + PH_TEMP_COEFF * (25.0 - tempC);
}

void printHeader() {
  Serial.println(F("PH\tEC (mS/cm)\tTEMP (C)\tHUM (%)\tSTATUS"));
}

void printRow(float ph, float ec, float t, float h) {
  Serial.print(ph, 2);
  Serial.print(F("\t"));
  Serial.print(ec, 2);
  Serial.print(F("\t"));
  Serial.print(t, 1);
  Serial.print(F("\t"));
  Serial.print(h, 0);
  Serial.print(F("\t"));

  String status = "OK";
  if (ph < 5.5 || ph > 7.5) status = "PH_WARN";
  if (ec < 0.5) status = "EC_LOW";
  Serial.println(status);
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  while (!Serial) { ; } // attesa seriale su USB native

  analogReadResolution(10);   // UNO default; su ESP32 si può usare 12
  dht.begin();

  delay(500);
  Serial.println(F("\n=== MyZubster PhEcSensor ==="));
  printHeader();
}

// ==================== LOOP ====================
void loop() {
  static unsigned long last = 0;
  unsigned long now = millis();
  if (now - last < READ_INTERVAL_MS) {
    delay(10);
    return;
  }
  last = now;

  float phRaw = readPH();
  float ecRaw = readEC();

  float tempC = NAN;
  float hum   = NAN;
#if defined(ESP32)
  tempC = dht.readTemperature();
  hum   = dht.readHumidity();
#else
  tempC = dht.readTemperature();
  hum   = dht.readHumidity();
#endif

  if (!isnan(tempC)) {
    phRaw = compensatePH(phRaw, tempC);
  }

  printRow(phRaw, ecRaw, tempC, hum);
}
