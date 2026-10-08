# Open Period Care — Independent VPS Verification Runbook v1

Status: **PREPARED — NOT YET RUN**

This runbook performs an independent technical reproduction of the public Open Period Care research package on the MyZubster VPS.

It does not imply contributor participation, endorsement, certification, payment, employment, partnership, Passport publication or LIFE participation.

## Frozen source

- Repository: `https://github.com/khongten124/myzubster`
- Branch: `feat/open-period-care-research-1450`
- Commit: `17cf7ca0a941d10e184771e574683785c1dbc8bf`

Required files:

- `docs/pilots/open-period-care/README.md`
- `docs/pilots/open-period-care/evidence-matrix.md`
- `docs/pilots/open-period-care/knowledge-cards.md`

## VPS safety boundary

Do **not** modify `/root/myzubster`.

Use an isolated directory:

```bash
mkdir -p /opt/myzubster/pilots/open-period-care-vps-check
cd /opt/myzubster/pilots/open-period-care-vps-check
```

No new inbound ports are required.

Do not print or copy secrets into logs or evidence.

## Phase 1 — fetch immutable public source

```bash
set -euo pipefail

WORK=/opt/myzubster/pilots/open-period-care-vps-check
SRC="$WORK/source"

rm -rf "$SRC"
git clone --no-checkout https://github.com/khongten124/myzubster.git "$SRC"
cd "$SRC"
git checkout --detach 17cf7ca0a941d10e184771e574683785c1dbc8bf

git rev-parse HEAD
```

Expected exact output:

```text
17cf7ca0a941d10e184771e574683785c1dbc8bf
```

## Phase 2 — verify required files

```bash
cd "$SRC"

for f in   docs/pilots/open-period-care/README.md   docs/pilots/open-period-care/evidence-matrix.md   docs/pilots/open-period-care/knowledge-cards.md
do
  test -s "$f"
  printf 'FOUND %s\n' "$f"
done
```

Expected: three `FOUND` lines.

## Phase 3 — record immutable file hashes

```bash
sha256sum   docs/pilots/open-period-care/README.md   docs/pilots/open-period-care/evidence-matrix.md   docs/pilots/open-period-care/knowledge-cards.md   | tee "$WORK/source-sha256.txt"
```

Keep this file as sanitized evidence.

## Phase 4 — inspect Knowledge Card states from the pinned source

Use this bounded parser:

```bash
python3 - <<'PY'
from pathlib import Path
import re

p = Path("docs/pilots/open-period-care/knowledge-cards.md")
text = p.read_text(encoding="utf-8")

cards = {}
for card_id in ("KC-OPC-001", "KC-OPC-002"):
    m = re.search(
        rf"id:\s*{re.escape(card_id)}.*?\nstatus:\s*([A-Z_]+)",
        text,
        flags=re.S,
    )
    if not m:
        raise SystemExit(f"MISSING {card_id}")
    cards[card_id] = m.group(1)

for k, v in cards.items():
    print(f"{k}={v}")

expected = {
    "KC-OPC-001": "SUPPORTED",
    "KC-OPC-002": "VERIFIED",
}

if cards != expected:
    raise SystemExit(f"UNEXPECTED_SOURCE_STATE {cards!r}")
PY
```

Expected exact semantic result:

```text
KC-OPC-001=SUPPORTED
KC-OPC-002=VERIFIED
```

### Important semantic drift

A previously recorded MyZubster interoperability checkpoint states:

```text
KC-OPC-001 -> SUPPORTED
KC-OPC-002 -> SUPPORTED
```

The pinned contributor source instead contains:

```text
KC-OPC-001 -> SUPPORTED
KC-OPC-002 -> VERIFIED
```

The VPS verification must record this as **semantic drift / source-state mismatch**.

Do not silently rewrite one source to match the other.

Also, the contributor source uses its own definition of `VERIFIED`. That label must not be restated as MyZubster clinical certification, medical licensing or scientific certification.

## Phase 5 — optional local MyZubster/Zorgax retrieval smoke

Run this only if the local MyZubster research index already contains an authorized/indexed copy of the Open Period Care material.

Do **not** crawl automatically.

Use the clean checkout, not `/root/myzubster`:

```bash
cd /opt/myzubster/core/myzubster

export MYZUBSTER_BASE_URL='http://127.0.0.1:5003'
export ZORGAX_RAG_SMOKE_QUERY='Open Period Care KC-OPC-001 KC-OPC-002'
export ZORGAX_RAG_SMOKE_SCOPE='all'

npm run smoke:zorgax-research
```

Required properties for a grounded PASS:

- local Zorgax status succeeds;
- local research status succeeds;
- at least one provenance-bearing source is returned;
- chat reports research provenance;
- final answer contains an exact source label such as `[R1]`;
- `research_crawl_performed=false`;
- no write-back occurs.

If the local index has no matching authorized source, the correct outcome is:

**PARTIAL / INDEX_NOT_POPULATED**

not FAIL of the external project.

Do not use this runbook as authorization to crawl the contributor repository or arbitrary web targets.

## Phase 6 — bounded claim check

Review the returned Zorgax answer and require all of these:

- no medical-license claim;
- no clinical-qualification claim;
- no professional-certification claim;
- no conversion of contributor source labels into broader MyZubster certification;
- explicit source/provenance preserved;
- no publication or third-party send.

If any unsupported credential claim appears, record the checkpoint as FAIL.

## Result classification

### TESTED_PASS

Use only if:

1. immutable commit fetched successfully;
2. required files and hashes recorded;
3. source states read exactly as:
   - KC-OPC-001 = SUPPORTED
   - KC-OPC-002 = VERIFIED;
4. semantic drift against the older MyZubster checkpoint is explicitly recorded;
5. bounded Zorgax retrieval, when the authorized local index is available, preserves provenance and claim boundaries;
6. no crawl, publication, secret exposure or production mutation occurs.

### PARTIAL

Use when source verification passes but local Zorgax retrieval cannot run because the authorized local index is not populated.

### TESTED_FAIL

Use when the bounded run executes and a required check fails, including unsupported credential/certification inference.

## Evidence to retain

Retain only sanitized artifacts:

- exact source commit;
- `source-sha256.txt`;
- Knowledge Card state output;
- bounded Zorgax smoke summary if executed;
- PASS / FAIL / PARTIAL;
- semantic-drift note;
- cleanup confirmation.

Do not retain credentials, tokens, personal health data or unrelated VPS configuration.

## Cleanup

```bash
rm -rf /opt/myzubster/pilots/open-period-care-vps-check/source
```

Optionally retain only the sanitized evidence files in a dedicated evidence directory.

Do not restart unrelated services and do not run `pm2 restart all`.
