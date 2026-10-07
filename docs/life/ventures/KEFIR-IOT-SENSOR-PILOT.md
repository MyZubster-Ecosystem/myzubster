# Kefir IoT Sensor Pilot — MyZubster

Date: 2026-10-07  
Pilot: `MZ-KEFIR-PILOT-001`

## Goal

Connect physical sensor observations to the existing kefir traceability flow without treating a raw sensor value as scientific validation.

Target chain:

```text
culture / sample / batch
  -> sensor device
  -> signed SENSOR_READING_RECORDED event
  -> MyZubster kefir ledger
  -> evidence / hash / timestamp
  -> Knowledge Graph / pilot evidence
  -> optional scientific review
```

## Existing hardware path

MyZubster already contains Arduino/ESP32 examples for:

- pH;
- EC;
- temperature;
- humidity;
- Wi-Fi upload;
- environmental sensing.

The kefir pilot reuses this hardware path rather than creating a separate IoT stack.

## Event type

`SENSOR_READING_RECORDED`

Required fields:

- `pilotId = MZ-KEFIR-PILOT-001`
- `subjects.productLotId`
- `subjects.deviceId`
- signed actor identity
- timestamp via `occurredAt`
- one or more measurements
- verification state

Recommended linking fields when known:

- `subjects.cultureId`
- batch / lot identifier
- protocol version
- evidence references

Example measurements:

```json
[
  { "metric": "temperature", "value": 22.4, "unit": "C", "method": "DHT22" },
  { "metric": "ph", "value": 4.5, "unit": "pH", "method": "analog-probe" }
]
```

## Evidence states

A recorded sensor event proves that MyZubster received and signed a value in a specific traceability context.

It does **not** by itself prove:

- that the probe was correctly calibrated;
- microbiological safety;
- food suitability;
- scientific significance;
- causation between a measurement and a fermentation outcome.

Those claims require an appropriate protocol, calibration evidence and/or external scientific review.

## CIRI / university discussion

For the 12 October discussion, the concrete question is:

> If MyZubster records temperature and pH against a specific kefir sample/batch with device, time and provenance, what calibration procedure, sampling interval, metadata and acceptance criteria would be required for those readings to become scientifically useful?

## Next implementation gates

1. choose physical ESP32/Arduino device;
2. assign stable `deviceId`;
3. map a real kefir sample/batch to the device;
4. record temperature first;
5. add pH only with a documented calibration procedure;
6. retain raw values and calibration metadata;
7. compare sensor timeline with fermentation events;
8. request scientific review before promoting evidence beyond `DOCUMENTED`.
