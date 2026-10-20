"""
Deterministic independent verification suite for contributor pilot evidence.
Ecosystem: MyZubster-Ecosystem/myzubster
Bounty / Issue Reference: #1516 (Independently verify another contributor pilot)
Target Contributor Artifact: khongten124 / Open Period Care
Immutable Source Commit: 17cf7ca0a941d10e184771e574683785c1dbc8bf
Canonical Registry: docs/contributions/khongten124-project-registry.json
Bridge Module: integrations/contributors/open-period-care/open_period_care_bridge.py
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import re
import sys
import unittest
from pathlib import Path

# Pinned provenance data from the immutable contributor checkpoint
PINNED_CONTRIBUTOR = "khongten124"
PINNED_COMMIT = "17cf7ca0a941d10e184771e574683785c1dbc8bf"
PINNED_REPO = "https://github.com/khongten124/myzubster"
PINNED_BRANCH = "feat/open-period-care-research-1450"

# Exact immutable commit hashes recorded in VPS verification manifest
# (docs/infrastructure/external-projects/khongten124-open-period-care.vps.json)
SOURCE_COMMIT_DIGESTS = {
    "README.md": "c2fd0c3f4377e45ebbc0f38cdf66d7b167da78ddb3893a4537b455c7ce95cacc",
    "evidence-matrix.md": "d5d45e427da3ca6279b6c881fccca7d0244e1019b63a2890bcfe4c0353930f48",
    "knowledge-cards.md": "a4d229b11914cc98c1664d192e192365e4ebfa8bfd303e3b6fa5b42561f66e3c",
}

# In-repo checkout artifacts in docs/pilots/open-period-care/ (as merged in MyZubster)
LOCAL_CHECKOUT_DIGESTS = {
    "README.md": "8b534d3033554cc519275c5a0dc056794fb7b57bc378d84ecd64a3ee7910e675",
    "evidence-matrix.md": "d5d45e427da3ca6279b6c881fccca7d0244e1019b63a2890bcfe4c0353930f48",
    "knowledge-cards.md": "0d07443c55ae8e54e4ac694519d0c7c2af31571f9ee3c8005bfa4e1bd9cba633",
}

HEX_SHA256_REGEX = re.compile(r"^[a-f0-9]{64}$")
ALLOWED_STATES = {"PROPOSED", "SUPPORTED", "TESTED", "VERIFIED"}


# Dynamically load the canonical bridge module from integrations/
ROOT_DIR = Path(__file__).resolve().parents[1]
BRIDGE_PATH = ROOT_DIR / "integrations" / "contributors" / "open-period-care" / "open_period_care_bridge.py"

if not BRIDGE_PATH.exists():
    raise FileNotFoundError(f"Canonical bridge module not found at {BRIDGE_PATH}")

spec = importlib.util.spec_from_file_location("open_period_care_bridge", BRIDGE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Unable to load bridge module from {BRIDGE_PATH}")
bridge_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = bridge_module
spec.loader.exec_module(bridge_module)


def validate_strict_contributor_evidence_contract(payload: dict) -> tuple[bool, str]:
    """
    Strict validation of contributor evidence records against MyZubster contract:
    - Required non-empty schema, contributor, repo, commit, path, sha256, states
    - Strict SHA-256 validation via ^[a-f0-9]{64}$ regex
    - Explicit rejection of disallowed states: raises ValueError if unapproved state found
    """
    required = ["schema", "contributor", "source_repo", "source_commit", "source_path", "source_sha256", "evidence_states"]
    for field in required:
        if field not in payload or not payload[field]:
            return False, f"Missing or empty required field: {field}"

    commit_val = payload.get("source_commit")
    if commit_val != PINNED_COMMIT:
        return False, f"Invalid commit provenance: expected {PINNED_COMMIT}, got {commit_val}"

    sha_val = payload.get("source_sha256", "")
    if not HEX_SHA256_REGEX.match(sha_val):
        return False, f"Invalid SHA-256 digest format: must match ^[a-f0-9]{{64}}$, got {sha_val!r}"

    # Strict check on evidence_states: reject any disallowed states explicitly
    states = payload.get("evidence_states", [])
    for st in states:
        if st not in ALLOWED_STATES:
            raise ValueError(f"Disallowed evidence state detected: {st!r} not in {sorted(ALLOWED_STATES)}")

    return True, "VALID"


class TestIndependentContributorPilotVerification(unittest.TestCase):
    """
    Independent verification suite validating the published evidence package
    of contributor khongten124 (Open Period Care) against issue #1516 criteria.
    """

    def setUp(self):
        self.root = Path(__file__).resolve().parents[1]
        self.pilot_dir = self.root / "docs" / "pilots" / "open-period-care"
        self.registry_path = self.root / "docs" / "contributions" / "khongten124-project-registry.json"
        self.checkpoint_path = self.root / "docs" / "contributors" / "interoperability-checkpoints" / "khongten124-semantic-bridge.json"
        self.verification_path = self.root / "docs" / "infrastructure" / "external-projects" / "khongten124-open-period-care.vps.json"

        # Requirement 1: No silent fallbacks. All mandatory artifacts MUST exist.
        if not self.registry_path.exists():
            raise FileNotFoundError(f"Mandatory registry missing: {self.registry_path}")
        if not self.checkpoint_path.exists():
            raise FileNotFoundError(f"Mandatory checkpoint missing: {self.checkpoint_path}")
        if not self.verification_path.exists():
            raise FileNotFoundError(f"Mandatory VPS verification manifest missing: {self.verification_path}")
        if not self.pilot_dir.exists():
            raise FileNotFoundError(f"Mandatory pilot docs directory missing: {self.pilot_dir}")

        with open(self.registry_path, "r", encoding="utf-8") as f:
            self.registry = json.load(f)

        with open(self.checkpoint_path, "r", encoding="utf-8") as f:
            self.checkpoint = json.load(f)

        with open(self.verification_path, "r", encoding="utf-8") as f:
            self.vps_manifest = json.load(f)

    def test_01_canonical_registry_provenance_and_immutability(self):
        """Verify contributor metadata points to exact pinned commit and unmerged PR scope."""
        self.assertEqual(self.registry.get("contributor", {}).get("github"), PINNED_CONTRIBUTOR)

        project = self.registry.get("project", {})
        self.assertEqual(project.get("repository"), PINNED_REPO)
        self.assertEqual(project.get("branch"), PINNED_BRANCH)
        self.assertEqual(project.get("commit"), PINNED_COMMIT)

        # Verify credential boundaries are strictly NOT_ESTABLISHED
        verification = self.registry.get("verification", {})
        self.assertEqual(verification.get("professionalCredential"), "NOT_ESTABLISHED")
        self.assertEqual(verification.get("medicalCredential"), "NOT_ESTABLISHED")
        self.assertEqual(verification.get("blockchainImplementation"), "NOT_ESTABLISHED")
        self.assertEqual(verification.get("physicalRecyclingProof"), "NOT_ESTABLISHED")

    def test_02_reproducible_artifact_file_hashes_and_scope_verification(self):
        """
        Verify real artifact verification with strict SHA-256 regex and dual-scope audit:
        1. Local checkout artifacts in docs/pilots/open-period-care/ match LOCAL_CHECKOUT_DIGESTS.
        2. VPS verification manifest outputs record exact SOURCE_COMMIT_DIGESTS matching
           the immutable source commit 17cf7ca0a941d10e184771e574683785c1dbc8bf.
        """
        for filename, expected_hash in LOCAL_CHECKOUT_DIGESTS.items():
            file_path = self.pilot_dir / filename
            self.assertTrue(file_path.exists(), f"Artifact file {filename} must exist in {self.pilot_dir}")

            content = file_path.read_bytes()
            computed_hash = hashlib.sha256(content).hexdigest()

            # Strict SHA-256 regex validation
            self.assertTrue(
                HEX_SHA256_REGEX.match(computed_hash),
                f"Computed hash {computed_hash} for {filename} is not a valid 64-char hex SHA-256"
            )
            self.assertEqual(
                computed_hash,
                expected_hash,
                f"Digest mismatch for local checkout artifact {filename}"
            )

        # Audit VPS manifest outputs for immutable commit hashes
        vps_outputs = self.vps_manifest.get("result", {}).get("outputs", [])
        for filename, source_hash in SOURCE_COMMIT_DIGESTS.items():
            expected_line = f"{filename} sha256={source_hash}"
            self.assertTrue(
                any(expected_line in line for line in vps_outputs),
                f"Expected immutable source commit hash record '{expected_line}' not found in VPS manifest"
            )

    def test_03_bridge_contract_and_state_preservation(self):
        """
        Verify production bridge module (open_period_care_bridge) normalization contract
        and evidence state extraction without unverified state promotion.
        """
        sample_card = "KC-OPC-001 is SUPPORTED under ISO 10993-5. Material state is PROPOSED."
        record = bridge_module.normalize(
            registry=self.registry,
            source_path="docs/pilots/open-period-care/knowledge-cards.md",
            source_url=f"{bridge_module.RAW_BASE}/knowledge-cards.md",
            content=sample_card,
        )

        record_dict = {
            "schema": record.schema,
            "contributor": record.contributor,
            "source_repo": record.source_repo,
            "source_commit": record.source_commit,
            "source_path": record.source_path,
            "source_sha256": record.source_sha256,
            "evidence_states": record.evidence_states,
        }

        valid, msg = validate_strict_contributor_evidence_contract(record_dict)
        self.assertTrue(valid, f"Contract validation failed: {msg}")
        self.assertIn("SUPPORTED", record.evidence_states)
        self.assertIn("PROPOSED", record.evidence_states)
        self.assertNotIn("TESTED", record.evidence_states)
        self.assertNotIn("VERIFIED", record.evidence_states)
        self.assertEqual(record.contributor, PINNED_CONTRIBUTOR)
        self.assertEqual(record.source_commit, PINNED_COMMIT)

    def test_04_explicit_rejection_of_disallowed_states_and_tampered_payloads(self):
        """
        Explicit rejection testing:
        - Must raise ValueError via assertRaises when disallowed or unmapped states are passed.
        - Must reject tampered commit SHA, malformed SHA-256, or missing provenance fields.
        """
        sample_content = "Requirement REQ-MAT-01 is SUPPORTED."
        record = bridge_module.normalize(
            registry=self.registry,
            source_path="README.md",
            source_url=f"{bridge_module.RAW_BASE}/README.md",
            content=sample_content,
        )

        base_dict = {
            "schema": record.schema,
            "contributor": record.contributor,
            "source_repo": record.source_repo,
            "source_commit": record.source_commit,
            "source_path": record.source_path,
            "source_sha256": record.source_sha256,
            "evidence_states": list(record.evidence_states),
        }

        # Case 1: Disallowed state must raise ValueError
        disallowed_dict = dict(base_dict, evidence_states=["CLINICAL_CERTIFIED", "SUPPORTED"])
        with self.assertRaises(ValueError) as ctx:
            validate_strict_contributor_evidence_contract(disallowed_dict)
        self.assertIn("Disallowed evidence state detected", str(ctx.exception))

        # Case 2: Tampered commit SHA
        tampered_commit = dict(base_dict, source_commit="0000000000000000000000000000000000000000")
        is_valid, msg = validate_strict_contributor_evidence_contract(tampered_commit)
        self.assertFalse(is_valid)
        self.assertIn("Invalid commit provenance", msg)

        # Case 3: Missing required field
        tampered_missing = dict(base_dict)
        del tampered_missing["source_sha256"]
        is_valid, msg = validate_strict_contributor_evidence_contract(tampered_missing)
        self.assertFalse(is_valid)
        self.assertIn("Missing or empty required field", msg)

        # Case 4: Malformed SHA-256 (not 64 lowercase hex)
        for bad_hash in ["badhash", "G" * 64, "a" * 63, "a" * 65]:
            tampered_hash = dict(base_dict, source_sha256=bad_hash)
            is_valid, msg = validate_strict_contributor_evidence_contract(tampered_hash)
            self.assertFalse(is_valid)
            self.assertIn("Invalid SHA-256 digest format", msg)

    def test_05_external_vps_manifest_and_interoperability_checkpoints(self):
        """
        Verify machine-readable checkpoints and VPS manifests preserve TESTED/SUPPORTED
        boundaries without premature scientific or clinical upgrading.
        """
        self.assertEqual(self.checkpoint.get("schema"), "myzubster.interoperability-checkpoint.v1")
        self.assertEqual(self.checkpoint.get("evidenceState"), "TESTED")
        limitations = self.checkpoint.get("limitations", [])
        self.assertTrue(
            any("does not establish medical" in l.lower() for l in limitations),
            "Checkpoint must explicitly state absence of medical/clinical certification"
        )

        self.assertEqual(self.vps_manifest.get("schema"), "myzubster.external-project-verification.v1")
        self.assertEqual(self.vps_manifest.get("status"), "TESTED_PASS")
        self.assertEqual(self.vps_manifest.get("source", {}).get("commit"), PINNED_COMMIT)
        self.assertEqual(self.vps_manifest.get("environment", {}).get("isolation"), "read-only-fetch")
        self.assertEqual(self.vps_manifest.get("environment", {}).get("secretsPolicy"), "no-secrets-in-evidence")


if __name__ == "__main__":
    unittest.main()
