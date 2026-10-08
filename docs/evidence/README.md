# Evidence Archive — N4K48 × foxxx009 Checkpoint

This directory stores all public evidence artifacts for the second independent node checkpoint.

## Structure

Each test run creates a sub-directory:

```
docs/evidence/
└── checkpoint-v1-<YYYYMMDD>-<run_id>/
    ├── n4k48-evidence.json
    ├── foxxx009-evidence.json
    ├── fixture-hash.txt
    ├── commands.sh
    ├── logs-n4k48.txt
    ├── logs-foxxx009.txt
    └── VERDICT.txt
```

## Fields per evidence file

Each `*-evidence.json` MUST contain:

- `contributor`: identifier (e.g. `nicolaususnicola-lgtm` or `foxxx009`)
- `repository`: full repo URL
- `branch`: branch name
- `commit_sha`: exact commit used
- `runtime_versions`: Node, Docker, OS, etc.
- `fixture_path`: path to fixture used
- `fixture_hash_sha256`: SHA-256 of the fixture
- `commands_run`: array of exact commands executed
- `result_json`: raw output from `run_checkpoint_test.sh --verify`
- `verdict`: `PASS` or `FAIL`
- `limitations`: array of known limitations
- `divergences`: array of any deviations from expected protocol
- `evidence_hash_sha256`: SHA-256 of the entire evidence directory (computed after all files written)

## Evidence hash computation

```bash
cd docs/evidence/checkpoint-v1-<YYYYMMDD>-<run_id>
tar czf - . | sha256sum | awk '{print $1}' > evidence-hash.txt
```

## State transitions

Evidence is only considered valid when:

1. All fields above are populated.
2. No secrets, credentials, keys, tokens, or private endpoints appear.
3. Both contributors have submitted their evidence files.
4. The `VERDICT.txt` file contains exactly `PASS` or `FAIL`.

State advances from `TESTED` → `VERIFIED` (on PASS) or `FAILED` only after evidence is reviewed and accepted by both parties.

## Pinning

For immutability, consider pinning the final evidence directory to IPFS and recording the CID in `VERDICT.txt`.
