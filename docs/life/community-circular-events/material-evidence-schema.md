# Material & Evidence Schema — Community Circular Events Pilot

**Status:** minimum working schema for a candidate LIFE-oriented pilot. Environmental methodology and legal/safety requirements remain subject to competent review.

## Goal

Define the minimum information needed to trace a material or product from entry into the pilot through reuse, repair, event/project use, recovery and subsequent use.

## Core entities

### 1. MaterialItem

Required fields:

```yaml
material_item_id: string
name: string
category: string
material_type: string
quantity_value: number
quantity_unit: string
source_type: string
source_reference: string|null
provenance_status: VERIFIED|PARTIAL|UNVERIFIED
condition_at_entry: string
intended_use: string
fitness_for_use_status: PENDING|ASSESSED|NOT_APPLICABLE
custodian_id: string|null
created_at: datetime
updated_at: datetime
```

Optional fields may include manufacturer/model, batch/lot, dimensions, composition, photos, repairability notes and recycling code where reliably known.

### 2. UseCycle

```yaml
use_cycle_id: string
material_item_id: string
pilot_id: string
activity_type: REUSE|REPAIR|TRANSFORMATION|TRANSFER|RECOVERY|DISPOSAL
start_at: datetime|null
end_at: datetime|null
location_visibility: PUBLIC|RESTRICTED|PRIVATE
location_reference: string|null
operator_stakeholder_id: string|null
quantity_in: number|null
quantity_out: number|null
quantity_unit: string|null
notes: string|null
```

### 3. EvidenceRecord

```yaml
evidence_id: string
subject_type: MATERIAL_ITEM|USE_CYCLE|KPI|STAKEHOLDER|PILOT
subject_id: string
evidence_type: PHOTO|WEIGHT_RECORD|RECEIPT|LOG|DECLARATION|INSPECTION|MEASUREMENT|DOCUMENT|OTHER
source_uri: string|null
source_hash: string|null
captured_at: datetime|null
producer: string|null
validation_status: PENDING|VALIDATED|REJECTED|NOT_REQUIRED
validator: string|null
validated_at: datetime|null
notes: string|null
```

### 4. KPIRecord

```yaml
kpi_id: string
pilot_id: string
kpi_name: string
baseline_value: number|null
baseline_unit: string|null
observed_value: number|null
observed_unit: string|null
calculation_method_reference: string
source_evidence_ids: [string]
validation_status: PENDING|VALIDATED|REJECTED
validator: string|null
```

## Minimum passport fields for an event material

For a material to be counted in the measurable pilot dataset, at minimum record:

- unique material ID;
- category/material type;
- quantity and unit;
- entry condition;
- source/provenance status;
- intended use;
- responsible custodian/operator where applicable;
- use-cycle association;
- post-use outcome;
- evidence reference for any claimed measurement.

## Lifecycle states

Suggested states:

`REGISTERED -> ELIGIBILITY_PENDING -> ELIGIBLE -> ALLOCATED -> IN_USE -> RECOVERED -> REUSED_AGAIN`

Alternative terminal states:

`NOT_ELIGIBLE`, `LOST_TO_FOLLOWUP`, `DISPOSED_WITH_EVIDENCE`.

Do not count `REGISTERED` or `ALLOCATED` material as environmental benefit. A claim starts only from measured/validated real-world outcomes under the agreed methodology.

## Measurement rules

- Prefer direct measurements such as documented weight/count where feasible.
- Keep original units and record conversion method if normalization is needed.
- Never infer avoided waste or avoided emissions solely from an item being listed or reused.
- Waste-prevention, carbon or other impact calculations require a documented baseline and accepted methodology.
- Duplicate evidence must not be double-counted.
- If provenance is partial or uncertain, keep that uncertainty explicit.

## Safety boundary

A digital material passport does not certify structural, electrical, fire, hygiene or other safety. Materials used in physical events must meet applicable legal and technical requirements for their intended use. Where a competent inspection is required, store only the reference/status needed for the pilot record.

## Privacy boundary

Do not publish private addresses, sensitive event locations, personal contact details or unnecessary personal data in public material records. Use restricted references where operationally necessary.

## Example record

```yaml
material_item_id: MAT-0001
name: Recovered timber panels
category: stage_material
material_type: timber
quantity_value: 120
quantity_unit: kg
source_type: recovery_operator
source_reference: EV-ENTRY-0001
provenance_status: VERIFIED
condition_at_entry: usable_after_inspection
intended_use: temporary non-structural event installation
fitness_for_use_status: ASSESSED
custodian_id: STK-001
```

The example is illustrative only and does not represent a real measured pilot result.
