# Lista componenti

Componenti minimi per un impianto di orto intelligente basato sugli sketch di esempio.

## Controllore centrale

| Nome                | Modello consigliato       | Q.tà | Note                                          | Prezzo indicativo (EUR) |
|---------------------|---------------------------|------|-----------------------------------------------|-------------------------|
| Scheda controllo    | Arduino Uno R3            | 1    | Può essere sostituita da Nano per spazio ridotto | 20 - 25                 |
| Scheda controllo    | ESP32 DevKit V1           | 1    | Necessaria per WiFi/cloud; alternativa a Uno    | 8 - 15                  |
| Cavo USB            | USB-A to USB-B / Micro    | 1    | Per programmazione e alimentazione              | 2 - 5                   |

## Sensori

| Nome                | Modello consigliato       | Q.tà | Note                                          | Prezzo indicativo (EUR) |
|---------------------|---------------------------|------|-----------------------------------------------|-------------------------|
| Sensore pH          | Gravity pH Sensor (analog)| 1    | Elettrodo BNC, calibrazione richiesta           | 25 - 40                 |
| Sensore EC          | Gravity EC Sensor (analog)| 1    | Con sonda K1.0                                 | 30 - 50                 |
| Temperatura/umidità | DHT22 (AM2302)            | 1    | Digitale, 1-wire                                | 3 - 6                   |
| Elettrodo pH        | Elettrodo di ricambio     | 1    | Compatibile con Gravity pH Sensor               | 8 - 15                  |
| Sonda EC            | Sonda di ricambio K=1     | 1    | Per manutenzione periodica                      | 10 - 20                 |
| Umidità suolo       | Capacitive Soil Moisture  | 1    | Analoga, richiede calibrazione                  | 3 - 8                   |
| Luce LDR            | Fotoresistore 10kΩ + LDR  | 1    | Partitore di tensione, calibrazione consigliata | 1 - 3                   |
| Pressione BMP180    | BMP180 / BMP085           | 1    | I2C, richiede libreria Adafruit                | 5 - 12                  |

## Attuatori

| Nome                | Modello consigliato       | Q.tà | Note                                          | Prezzo indicativo (EUR) |
|---------------------|---------------------------|------|-----------------------------------------------|-------------------------|
| Relè                | Relè 1 canale 5V          | 1    | Modulo optoisolato, attivo basso o alto         | 2 - 4                   |
| Pompa acqua         | Mini pompa 5V o 12V       | 1    | Con tubo in silicone 6x8 mm                    | 5 - 12                  |
| Tubo silicone       | 6x8 mm, 1 metro           | 1    | Per acqua dolce                                | 2 - 4                   |

## Alimentazione

| Nome                | Modello consigliato       | Q.tà | Note                                          | Prezzo indicativo (EUR) |
|---------------------|---------------------------|------|-----------------------------------------------|-------------------------|
| Power bank 5V       | 5V 2A                     | 1    | Per test e piccoli impianti                     | 10 - 20                 |
| Alimentatore 12V     | 12V 2A switching           | 1    | Se si usa pompa 12V                            | 8 - 15                  |
| Batteria LiPo 18650 | 18650 2600mAh + holder    | 2    | Con circuito di caricabatteria TP4056           | 8 - 15                  |

## Strumenti

| Nome                | Modello consigliato       | Q.tà | Note                                          | Prezzo indicativo (EUR) |
|---------------------|---------------------------|------|-----------------------------------------------|-------------------------|
| Multimetro          | Digitale 6000 count       | 1    | Per verifiche tensione e continuità             | 10 - 25                 |
| Soluzioni buffer pH | pH 4.00 / 7.00 / 10.01   | 1 set| Flaconi 250ml                                  | 15 - 30                 |
| Soluzioni EC        | 1413 uS/cm / 12.88 mS/cm | 1 set| Standard KCl                                   | 15 - 25                 |

## Note
- I prezzi sono indicativi e variano in base al rivenditore e alla regione.
- Per installazioni esterne considerare contenitori stagni (IP65) per elettronica.
- Usare cavi schermati per i segnali analogici se lunghi >30 cm.
