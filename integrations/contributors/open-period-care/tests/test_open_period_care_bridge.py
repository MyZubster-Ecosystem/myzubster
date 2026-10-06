import hashlib
import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "open_period_care_bridge.py"

spec = importlib.util.spec_from_file_location("open_period_care_bridge", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Unable to load bridge module from {MODULE_PATH}")

bridge = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = bridge
spec.loader.exec_module(bridge)


class OpenPeriodCareBridgeTests(unittest.TestCase):
    def setUp(self):
        self.registry = {
            "contributor": {"github": "khongten124"},
            "project": {
                "canonicalName": "Open Period Care — Research & Knowledge Package",
                "repository": "https://github.com/khongten124/myzubster",
                "branch": "feat/open-period-care-research-1450",
                "commit": "17cf7ca0a941d10e184771e574683785c1dbc8bf",
            },
        }

    def test_normalize_preserves_provenance_and_hash(self):
        content = "Requirement REQ-MAT-01 is SUPPORTED. Prototype result is not VERIFIED."
        record = bridge.normalize(
            registry=self.registry,
            source_path="evidence-matrix.md",
            source_url="https://example.test/evidence-matrix.md",
            content=content,
        )

        self.assertEqual(record.contributor, "khongten124")
        self.assertEqual(record.source_branch, "feat/open-period-care-research-1450")
        self.assertEqual(record.source_commit, "17cf7ca0a941d10e184771e574683785c1dbc8bf")
        self.assertEqual(
            record.source_sha256,
            hashlib.sha256(content.encode("utf-8")).hexdigest(),
        )

    def test_evidence_states_are_not_promoted(self):
        content = "REQ-1: SUPPORTED\nREQ-2: PROPOSED"
        record = bridge.normalize(
            registry=self.registry,
            source_path="fixture.md",
            source_url="https://example.test/fixture.md",
            content=content,
        )
        self.assertEqual(record.evidence_states, ["PROPOSED", "SUPPORTED"])
        self.assertNotIn("TESTED", record.evidence_states)
        self.assertNotIn("VERIFIED", record.evidence_states)

    def test_build_records_fetches_three_read_only_sources(self):
        seen = []

        def fake_fetch(url):
            seen.append(url)
            return "# Fixture\nstatus: SUPPORTED\n"

        original_load_registry = bridge.load_registry
        bridge.load_registry = lambda: self.registry
        try:
            records = bridge.build_records(fetcher=fake_fetch)
        finally:
            bridge.load_registry = original_load_registry

        self.assertEqual(len(records), 3)
        self.assertEqual(len(seen), 3)
        self.assertTrue(all(record.bridge_status == "READ_ONLY_NORMALIZED" for record in records))
        self.assertTrue(all(record.evidence_states == ["SUPPORTED"] for record in records))


if __name__ == "__main__":
    unittest.main()
