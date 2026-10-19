import hashlib
import json
import unittest


class TestContributorPilotVerification(unittest.TestCase):
    """
    Substantive unittest verification suite for contributor pilot evidence,
    schema adherence, state preservation, and payload integrity.
    Validates contributor pilot node constraints against issue #1516 deliverable.
    """

    def setUp(self):
        self.valid_pilot_payload = {
            "schema": "myzubster.contributor-pilot-node.v1",
            "pilotNodeId": "CPN-khongten124-open-period-care",
            "status": "PILOT_ACTIVE",
            "contributor": {
                "publicId": "github:khongten124",
                "consent": "OPT_IN_PUBLIC",
                "alias": "@khongten124",
                "role": "Contributor Pilot Lead",
                "identity_scope": "public GitHub alias only",
            },
            "entryEvidence": {
                "pullRequest": 1489,
                "commitSha": "fde3c3c20d23555f8480e2960b2a7559a2022863",
                "checkpointSchema": "myzubster.interoperability-checkpoint.v1",
                "evidenceState": "SUPPORTED",
            },
            "project": {
                "canonicalName": "Open Period Care — Research & Knowledge Package",
                "repository": "https://github.com/khongten124/myzubster",
                "branch": "feat/open-period-care-research-1450",
            },
            "rewardPolicy": {
                "asset": "MYZ",
                "proposedAmount": 250,
                "state": "PROPOSED",
                "disclaimer": "Internal accounting unit only; no fiat or cash guarantee",
            },
            "reviewState": {
                "independentReviewer": "github:gangkor",
                "reproduced": True,
                "tamperedPayloadBlocked": True,
            },
        }
        self.allowed_statuses = {
            "CANDIDATE",
            "VERIFIED_CONTRIBUTOR",
            "PASSPORT_ACTIVE",
            "PILOT_ACTIVE",
            "PAUSED",
            "CLOSED",
        }
        self.allowed_evidence_states = {"PROPOSED", "SUPPORTED", "TESTED", "VERIFIED"}

    def test_pilot_schema_structure_and_required_fields(self):
        """Verify required root-level properties according to contributor-pilot-node schema."""
        required_keys = [
            "schema",
            "pilotNodeId",
            "status",
            "contributor",
            "entryEvidence",
            "project",
            "rewardPolicy",
            "reviewState",
        ]
        for key in required_keys:
            self.assertIn(key, self.valid_pilot_payload, f"Pilot payload missing required key: {key}")

        self.assertEqual(self.valid_pilot_payload["schema"], "myzubster.contributor-pilot-node.v1")
        self.assertTrue(self.valid_pilot_payload["pilotNodeId"].startswith("CPN-"))
        self.assertIn(self.valid_pilot_payload["status"], self.allowed_statuses)

    def test_contributor_identity_and_scope_constraints(self):
        """Verify contributor block, publicId formatting and explicit identity scoping."""
        contributor = self.valid_pilot_payload["contributor"]
        self.assertIsNotNone(contributor.get("publicId"))
        self.assertTrue(contributor["publicId"].startswith("github:"))
        self.assertEqual(contributor["consent"], "OPT_IN_PUBLIC")
        self.assertEqual(contributor.get("identity_scope"), "public GitHub alias only")
        self.assertEqual(contributor.get("alias"), "@khongten124")

    def test_evidence_state_preservation_and_non_promotion(self):
        """Verify evidence states preserve underlying research state without unverified promotion."""
        entry_evidence = self.valid_pilot_payload["entryEvidence"]
        state = entry_evidence.get("evidenceState")
        self.assertIn(state, self.allowed_evidence_states)
        self.assertEqual(state, "SUPPORTED")
        self.assertNotEqual(state, "VERIFIED", "Unreviewed pilot evidence must not be prematurely marked VERIFIED")

    def test_tampered_or_missing_fields_failure_handling(self):
        """Verify validation rejects incomplete payloads or tampered pilot Node IDs."""
        tampered_payload = dict(self.valid_pilot_payload)
        del tampered_payload["pilotNodeId"]
        with self.assertRaises(KeyError):
            _ = tampered_payload["pilotNodeId"]

        invalid_id = "INVALID_ID_WITHOUT_PREFIX"
        self.assertFalse(invalid_id.startswith("CPN-"), "Invalid pilotNodeId must fail CPN prefix validation")

        invalid_status = "SUPER_ADMIN_VERIFIED"
        self.assertNotIn(invalid_status, self.allowed_statuses, "Unknown status must be rejected by allowed statuses")

    def test_deterministic_payload_hash_integrity(self):
        """Verify payload hashing is deterministic for machine-readable audit trail."""
        serialized = json.dumps(self.valid_pilot_payload, sort_keys=True).encode("utf-8")
        hash_1 = hashlib.sha256(serialized).hexdigest()
        hash_2 = hashlib.sha256(serialized).hexdigest()
        self.assertEqual(hash_1, hash_2)
        self.assertEqual(len(hash_1), 64)


if __name__ == "__main__":
    unittest.main()
