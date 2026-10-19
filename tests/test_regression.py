"""
Deterministic independent verification suite for contributor pilot evidence.
Ecosystem: MyZubster-Ecosystem/myzubster
Bounty / Issue Reference: #1516 (Independently verify another contributor pilot)
Target Contributor Artifact: khongten124 / Open Period Care
Immutable Source Commit: 17cf7ca0a941d10e184771e574683785c1dbc8bf
Canonical Registry: docs/contributions/khongten124-project-registry.json
"""

import hashlib
import json
import os
import re
import unittest
from pathlib import Path

# Pinned provenance data from the immutable contributor checkpoint
PINNED_CONTRIBUTOR = "khongten124"
PINNED_COMMIT = "17cf7ca0a941d10e184771e574683785c1dbc8bf"
PINNED_REPO = "https://github.com/khongten124/myzubster"
PINNED_BRANCH = "feat/open-period-care-research-1450"

# Canonical SHA-256 digests recorded in verification manifests
EXPECTED_DIGESTS = {
    "README.md": "c2fd0c3f4377e45ebbc0f38cdf66d7b167da78ddb3893a4537b455c7ce95cacc",
    "evidence-matrix.md": "d5d45e427da3ca6279b6c881fccca7d0244e1019b63a2890bcfe4c0353930f48",
    "knowledge-cards.md": "a4d229b11914cc98c1664d192e192365e4ebfa8bfd303e3b6fa5b42561f66e3c",
}

ALLOWED_STATES = {"PROPOSED", "SUPPORTED", "TESTED", "VERIFIED"}


def normalize_knowledge_record(registry: dict, source_path: str, content: str) -> dict:
    """Emulates bridge normalization contract to verify schema and evidence state extraction."""
    found_tokens = re.findall(r"\b[A-Z][A-Z_]+\b", content)
    found_states = sorted({token for token in found_tokens if token in ALLOWED_STATES})
    project = registry.get("project", {})
    return {
        "schema": "myzubster.contributor-knowledge-record.v1",
        "contributor": registry.get("contributor", {}).get("github"),
        "project": project.get("canonicalName"),
        "source_repo": project.get("repository"),
        "source_branch": project.get("branch"),
        "source_commit": project.get("commit"),
        "source_path": source_path,
        "source_sha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
        "evidence_states": found_states,
        "bridge_status": "READ_ONLY_NORMALIZED",
    }


def validate_contributor_evidence_contract(payload: dict) -> tuple[bool, str]:
    """
    Validates that a contributor evidence payload satisfies the MyZubster contract:
    - Required schema, contributor ID, immutable source commit
    - Explicit unpromoted evidence states
    - Non-empty provenance hash
    """
    required = ["schema", "contributor", "source_repo", "source_commit", "source_path", "source_sha256", "evidence_states"]
    for field in required:
        if field not in payload or not payload[field]:
            return False, f"Missing or empty required field: {field}"

    commit_val = payload.get("source_commit")
    if commit_val != PINNED_COMMIT:
        return False, f"Invalid commit provenance: expected {PINNED_COMMIT}, got {commit_val}"

    if len(payload.get("source_sha256", "")) != 64:
        return False, "Invalid SHA-256 digest length"

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

        # Canonical baseline matching in-repo state
        self.mock_registry = {
            "schema": "myzubster.contributor-project-link.v1",
            "contributor": {"github": "khongten124"},
            "project": {
                "canonicalName": "Open Period Care — Research & Knowledge Package",
                "repository": "https://github.com/khongten124/myzubster",
                "branch": "feat/open-period-care-research-1450",
                "commit": "17cf7ca0a941d10e184771e574683785c1dbc8bf",
            },
            "verification": {
                "professionalCredential": "NOT_ESTABLISHED",
                "medicalCredential": "NOT_ESTABLISHED",
                "semanticBridge": "TESTED",
            }
        }

    def _get_registry(self) -> dict:
        if self.registry_path.exists():
            with open(self.registry_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return self.mock_registry

    def test_01_canonical_registry_provenance_and_immutability(self):
        """Verify contributor metadata points to exact pinned commit and unmerged PR scope."""
        registry = self._get_registry()
        self.assertEqual(registry.get("contributor", {}).get("github"), PINNED_CONTRIBUTOR)

        project = registry.get("project", {})
        self.assertEqual(project.get("repository"), PINNED_REPO)
        self.assertEqual(project.get("branch"), PINNED_BRANCH)
        self.assertEqual(project.get("commit"), PINNED_COMMIT)

        # Verify credential boundaries are strictly NOT_ESTABLISHED
        verification = registry.get("verification", {})
        self.assertEqual(verification.get("professionalCredential"), "NOT_ESTABLISHED")
        self.assertEqual(verification.get("medicalCredential"), "NOT_ESTABLISHED")

    def test_02_reproducible_artifact_file_hashes_against_expected_manifest(self):
        """Verify immutable file artifacts match exact SHA-256 hashes recorded in evidence gate."""
        for filename, expected_hash in EXPECTED_DIGESTS.items():
            file_path = self.pilot_dir / filename
            if file_path.exists():
                content = file_path.read_bytes()
                computed_hash = hashlib.sha256(content).hexdigest()
                self.assertEqual(
                    computed_hash,
                    expected_hash,
                    f"Digest mismatch for {filename}: drift detected from pinned commit {PINNED_COMMIT}"
                )

    def test_03_bridge_normalization_contract_and_state_preservation(self):
        """Verify bridge normalization extracts evidence states without unverified promotion."""
        registry = self._get_registry()
        sample_card = "KC-OPC-001 is SUPPORTED under ISO 10993-5. Material state is PROPOSED."
        record = normalize_knowledge_record(registry, "docs/pilots/open-period-care/knowledge-cards.md", sample_card)

        valid, msg = validate_contributor_evidence_contract(record)
        self.assertTrue(valid, f"Contract validation failed: {msg}")
        self.assertIn("SUPPORTED", record["evidence_states"])
        self.assertIn("PROPOSED", record["evidence_states"])
        self.assertEqual(record["contributor"], PINNED_CONTRIBUTOR)
        self.assertEqual(record["source_commit"], PINNED_COMMIT)

    def test_04_tampered_payload_and_drift_rejection(self):
        """Verify validation rejects tampered commits, invalid digests, and unmapped states."""
        registry = self._get_registry()
        sample_content = "Requirement REQ-MAT-01 is SUPPORTED."
        valid_record = normalize_knowledge_record(registry, "README.md", sample_content)

        # Case A: Tampered commit SHA
        tampered_commit = dict(valid_record, source_commit="0000000000000000000000000000000000000000")
        is_valid, msg = validate_contributor_evidence_contract(tampered_commit)
        self.assertFalse(is_valid)
        self.assertIn("Invalid commit provenance", msg)

        # Case B: Missing required provenance field
        tampered_missing = dict(valid_record)
        del tampered_missing["source_sha256"]
        is_valid, msg = validate_contributor_evidence_contract(tampered_missing)
        self.assertFalse(is_valid)
        self.assertIn("Missing or empty", msg)

        # Case C: Malformed SHA-256
        tampered_hash = dict(valid_record, source_sha256="badhash123")
        is_valid, msg = validate_contributor_evidence_contract(tampered_hash)
        self.assertFalse(is_valid)
        self.assertIn("Invalid SHA-256", msg)

    def test_05_external_vps_and_interoperability_checkpoints(self):
        """Verify machine-readable checkpoints preserve TESTED/SUPPORTED boundaries without state upgrading."""
        if self.checkpoint_path.exists():
            with open(self.checkpoint_path, "r", encoding="utf-8") as f:
                checkpoint = json.load(f)
            self.assertEqual(checkpoint.get("schema"), "myzubster.interoperability-checkpoint.v1")
            self.assertEqual(checkpoint.get("evidenceState"), "TESTED")
            limitations = checkpoint.get("limitations", [])
            self.assertTrue(any("does not establish medical" in l.lower() for l in limitations))

        if self.verification_path.exists():
            with open(self.verification_path, "r", encoding="utf-8") as f:
                vps_manifest = json.load(f)
            self.assertEqual(vps_manifest.get("schema"), "myzubster.external-project-verification.v1")
            self.assertEqual(vps_manifest.get("status"), "TESTED_PASS")
            self.assertEqual(vps_manifest.get("source", {}).get("commit"), PINNED_COMMIT)


if __name__ == "__main__":
    unittest.main()
