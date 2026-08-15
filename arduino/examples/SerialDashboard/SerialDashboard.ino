/**
 * SerialDashboard.ino
 *
 * Dashboard locale per il monitoraggio seriale.
 * Periodicamente legge pH, EC, temperatura e umidità e stampa
 * una tabella formattata con indicatori di stato e soglie di allarme.
 *
 * Wiring:
 *   - pH sensor   -> A0
 *   - EC sensor   -> A1
 *   - DHT22       -> pin 2
 *
 * Librerie:
 *   - DHT sensor library (Adafruit)
 *   - Adafruit Unified Sensor
 */

#include <Arduino.h>
#include <DHT.h>

// ==================== PIN ====================
const uint8_t PIN_PH  = A0;
const uint8_t PIN_EC  = A1;
const uint8_t PIN_DHT = 2;

#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// ==================== COEFFICIENTI ====================
const float PH_OFFSET     = 0.0;
const float EC_K           = 1.0;
const float PH_TEMP_COEFF  = 0.03;

// ==================== SOGLIE ====================
const float PH_MIN = 5.5;
const float PH_MAX = 7.5;
const float EC_MIN = 0.5;    // mS/cm
const float EC_MAX = 4.0;    // mS/cm
const float TEMP_MIN = 10.0;
const float TEMP_MAX = 35.0;

// ==================== INTERVALLO ====================
const unsigned long UPDATE_INTERVAL_MS = 2000UL;

// ==================== LETTURE ====================
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

String statusPH(float ph) {
  if (ph < PH_MIN || ph > PH_MAX) return "ALERT";
  return "OK";
}

String statusEC(float ec) {
  if (ec < EC_MIN) return "LOW";
  if (ec > EC_MAX) return "HIGH";
  return "OK";
}

String statusTemp(float t) {
  if (isnan(t)) return "N/A";
  if (t < TEMP_MIN || t > TEMP_MAX) return "ALERT";
  return "OK";
}

// ==================== STAMPA DASHBOARD ====================
void printDashboard(float ph, float ec, float tempC, float hum) {
  Serial.println(F("\033[2J\033[H"));   // ANSI clear screen + home (funziona su molti terminali)

  Serial.println(F("===================================="));
  Serial.println(F("       MyZubster Serial Dashboard    "));
  Serial.println(F("===================================="));

  Serial.print(F("pH     : "));
  Serial.print(ph, 2);
  Serial.print(F("   ["));
  Serial.print(statusPH(ph));
  Serial.println(F("]"));

  Serial.print(F("EC     : "));
  Serial.print(ec, 2);
  Serial.print(F(" mS/cm ["));
  Serial.print(statusEC(ec));
  Serial.println(F("]"));

  Serial.print(F("Temp   : "));
  if (!isnan(tempC)) {
    Serial.print(tempC, 1);
    Serial.print(F(" C   ["));
    Serial.print(statusTemp(tempC));
    Serial.println(F("]"));
  } else {
    Serial.println(F("N/A   [N/A]"));
  }

  Serial.print(F("Hum    : "));
  if (!isnan(hum)) {
    Serial.print(hum, 0);
    Serial.println(F(" %"));
  } else {
    Serial.println(F("N/A"));
  }

  Serial.println(F("------------------------------------"));

  if (ph < PH_MIN) Serial.println(F("[!] pH sotto la soglia minima"));
  if (ph > PH_MAX) Serial.println(F("[!] pH sopra la soglia massima"));
  if (!isnan(ec) && ec < EC_MIN) Serial.println(F("[!] EC basso: possibile carenza nutrimenti"));
  if (!isnan(ec) && ec > EC_MAX) Serial.println(F("[!] EC alto: rischio salinità"));
  if (!isnan(tempC) && (tempC < TEMP_MIN || tempC > TEMP_MAX)) Serial.println(F("[!] Temperatura fuori range"));

  Serial.println(F("===================================="));
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

  dht.begin();
  analogReadResolution(10);

  delay(500);
  Serial.println(F("Avvio dashboard..."));
}

// ==================== LOOP ====================
void loop() {
  static unsigned long last = 0;
  unsigned long now = millis();

  if (now - last >= UPDATE_INTERVAL_MS) {
    last = now;

    float ph    = readPH();
    float ec    = readEC();
    float tempC = dht.readTemperature();
    float hum   = dht.readHumidity();

    if (!isnan(tempC)) {
      ph = ph + PH_TEMP_COEFF * (25.0 - tempC);
    }

    printDashboard(ph, ec, tempC, hum);
  }

  delay(100);
}
