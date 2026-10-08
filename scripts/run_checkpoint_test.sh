#!/usr/bin/env bash
#
# run_checkpoint_test.sh
# Reproducible entry-point for the N4K48 × foxxx009 second independent node checkpoint.
#
# Usage:
#   ./scripts/run_checkpoint_test.sh [--fixture PATH] [--verify] [--help]
#
# This script:
#   1. Validates that the fixture exists and is the expected sanitized version.
#   2. Computes the SHA-256 of the fixture.
#   3. Simulates the checkpoint flow (VPS → broker → agent → catalog → Bridge) using
#      deterministic local-only logic. No network calls, no secrets, no production endpoints.
#   4. Prints the result in a structured JSON form suitable for evidence publication.
#
# Both contributors run this script against the same fixture to produce comparable output.

set -euo pipefail

FIXTURE_PATH=""
VERIFY_MODE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXPECTED_FIXTURE_HASH=""  # To be filled before READY state; computed once and pinned.

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --fixture PATH   Path to the sanitized checkpoint fixture JSON (required).
  --verify         After computing the result, verify it against the expected hash
                   embedded in the fixture. Prints PASS or FAIL.
  --help           Show this help message.

Environment:
  EXPECTED_FIXTURE_HASH  SHA-256 of the canonical fixture file. Set before READY state.
EOF
  exit 0
}

log_info() {
  echo "[INFO] $*"
}

log_error() {
  echo "[ERROR] $*" >&2
}

sha256_of() {
  if command -v shasum &>/dev/null; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum &>/dev/null; then
    sha256sum "$1" | awk '{print $1}'
  else
    log_error "Neither shasum nor sha256sum found. Install coreutils or bsdmainutils."
    exit 1
  fi
}

validate_fixture() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    log_error "Fixture file not found: $path"
    exit 1
  fi
  if [[ ! -r "$path" ]]; then
    log_error "Fixture file not readable: $path"
    exit 1
  fi
  # Basic JSON validation using python3 if available, otherwise skip.
  if command -v python3 &>/dev/null; then
    python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$path" \
      || { log_error "Fixture is not valid JSON: $path"; exit 1; }
  fi
  log_info "Fixture validated: $path"
}

compute_fixture_hash() {
  local path="$1"
  sha256_of "$path"
}

run_checkpoint_simulation() {
  local fixture_path="$1"
  # Deterministic simulation of the checkpoint pipeline.
  # In a real implementation this would invoke the actual N4K48 components.
  # Here we produce a stable, reproducible output derived solely from the fixture content.
  python3 - "$fixture_path" <<'PYEOF'
import json
import hashlib
import sys

fixture_path = sys.argv[1]
with open(fixture_path, "r") as f:
    fixture = json.load(f)

seed = fixture["input_payload"]["seed"]
messages = fixture["input_payload"]["messages"]

# Deterministic hash derived from fixture content (no secrets, no external state)
combined = json.dumps(fixture, sort_keys=True, separators=(",", ":"))
payload_hash = hashlib.sha256(combined.encode("utf-8")).hexdigest()

result = {
    "status": "ok",
    "checkpoint": fixture["checkpoint_version"],
    "participant_n4k48": fixture["participant_n4k48"],
    "participant_foxxx009": fixture["participant_foxxx009"],
    "fixture_hash": payload_hash,
    "messages_processed": len(messages),
    "bridge_response": {
        "status": "ok",
        "checkpoint": fixture["checkpoint_version"],
        "hash": payload_hash
    }
}
print(json.dumps(result, indent=2, sort_keys=True))
PYEOF
}

verify_result() {
  local fixture_path="$1"
  local result_json="$2"

  local expected_hash
  expected_hash=$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
print(data['expected_bridge_response']['hash'])
" "$fixture_path")

  if [[ "$expected_hash" == "__EXPECTED_HASH_PLACEHOLDER__" ]]; then
    echo "VERIFY_SKIP"
    return
  fi

  local actual_hash
  actual_hash=$(echo "$result_json" | python3 -c "
import json, sys
result = json.load(sys.stdin)
print(result['bridge_response']['hash'])
")

  if [[ "$actual_hash" == "$expected_hash" ]]; then
    echo "PASS"
  else
    echo "FAIL"
  fi
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fixture)
      shift
      FIXTURE_PATH="${1:?--fixture requires a path argument}"
      shift
      ;;
    --verify)
      VERIFY_MODE=true
      shift
      ;;
    --help)
      usage
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      ;;
  esac
done

if [[ -z "$FIXTURE_PATH" ]]; then
  log_error "--fixture is required."
  usage
fi

# Resolve to absolute path
FIXTURE_PATH="$(realpath "$FIXTURE_PATH")"

# --- Execution ---
log_info "Starting N4K48 × foxxx009 checkpoint test (v1)"
log_info "Repository root: $REPO_ROOT"

validate_fixture "$FIXTURE_PATH"

FIXTURE_HASH=$(compute_fixture_hash "$FIXTURE_PATH")
log_info "Fixture SHA-256: $FIXTURE_HASH"

if [[ -n "$EXPECTED_FIXTURE_HASH" && "$FIXTURE_HASH" != "$EXPECTED_FIXTURE_HASH" ]]; then
  log_error "Fixture hash mismatch! Expected: $EXPECTED_FIXTURE_HASH, Got: $FIXTURE_HASH"
  log_error "The fixture may have been tampered with or is the wrong version."
  exit 1
fi

RESULT_JSON=$(run_checkpoint_simulation "$FIXTURE_PATH")
echo "$RESULT_JSON"

if [[ "$VERIFY_MODE" == true ]]; then
  VERDICT=$(verify_result "$FIXTURE_PATH" "$RESULT_JSON")
  echo ""
  echo "=== VERDICT: $VERDICT ==="
  if [[ "$VERDICT" == "FAIL" ]]; then
    exit 1
  fi
fi

log_info "Checkpoint test completed successfully."
