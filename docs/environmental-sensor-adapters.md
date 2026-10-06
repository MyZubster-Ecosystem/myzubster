# Environmental sensor adapter contract

The first #534 milestone defines a vendor-neutral boundary between raw sensor
payloads and MyZubster environmental readings. It does not connect to hardware,
production endpoints, or partner data.

## Adapter definition

Create an adapter with `createSensorAdapter` and provide:

- a stable adapter `id` and `version`;
- the logical `sensorType`;
- one canonical unit and optional input aliases;
- a finite physical/demo range;
- a `map(payload)` function that maps a vendor payload to the contract fields.

The map result must contain:

- `sourceId` and `deviceId`;
- `observedAt` with a UTC offset;
- `value` and `unit`;
- `qualityStatus`: `VALID`, `SUSPECT`, or `INVALID`;
- `method`, plus optional non-sensitive `metadata`.

## Normalized reading

```json
{
  "schemaVersion": "environmental-reading/1.0",
  "sensorType": "soil-moisture",
  "observedAt": "2026-08-30T12:00:00.000Z",
  "value": 42.5,
  "unit": "%",
  "source": {
    "sourceId": "pilot-alpha-bed-3",
    "deviceId": "moisture-probe-7"
  },
  "quality": { "status": "VALID" },
  "provenance": {
    "adapterId": "synthetic-moisture-json",
    "adapterVersion": "1.0.0",
    "method": "synthetic-json",
    "rawValue": 42.5,
    "rawUnit": "percent",
    "metadata": { "sequence": 18 }
  }
}
```

The normalized record and its nested source, quality, and provenance values are
frozen after validation. Downstream code therefore cannot silently rewrite the
source evidence.

## Validation boundary

Normalization rejects missing source/device identifiers, timestamps without a
timezone, unsupported units, non-finite values, values outside the adapter's
declared range, unknown quality statuses, and malformed adapter output.

Reference sensor connectors, the synthetic demonstration, and downstream
export are intentionally deferred until this schema/contract milestone is
reviewed.
