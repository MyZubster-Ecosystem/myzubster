"""
Unit Tests for Open Period Care Pilot Knowledge Package & Requirements
Validates markdown structure, knowledge card schema, citations, and evidence matrix completeness.
"""

import os
import re
import unittest

PILOT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "pilots", "open-period-care")

class TestOpenPeriodCarePilot(unittest.TestCase):
    def setUp(self):
        self.readme_path = os.path.join(PILOT_DIR, "README.md")
        self.matrix_path = os.path.join(PILOT_DIR, "evidence-matrix.md")
        self.cards_path = os.path.join(PILOT_DIR, "knowledge-cards.md")

    def test_files_exist(self):
        self.assertTrue(os.path.exists(self.readme_path), "README.md must exist")
        self.assertTrue(os.path.exists(self.matrix_path), "evidence-matrix.md must exist")
        self.assertTrue(os.path.exists(self.cards_path), "knowledge-cards.md must exist")

    def test_cross_references(self):
        with open(self.readme_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("#1399", content, "Must reference pilot issue #1399")
        self.assertIn("#1450", content, "Must reference bounty issue #1450")

    def test_citations_count(self):
        with open(self.readme_path, "r", encoding="utf-8") as f:
            content = f.read()
        citations = re.findall(r"\*\*S\d+\*\*", content)
        self.assertGreaterEqual(len(citations), 5, "Must cite at least 5 verifiable sources")

    def test_evidence_matrix_states(self):
        with open(self.matrix_path, "r", encoding="utf-8") as f:
            content = f.read()
        valid_states = ["PROPOSED", "SUPPORTED", "TESTED", "VERIFIED"]
        for state in valid_states:
            self.assertIn(f"`{state}`", content, f"Matrix must reference state `{state}`")

    def test_knowledge_cards_count_and_keys(self):
        with open(self.cards_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("id: KC-OPC-001", content, "Must contain Knowledge Card 1")
        self.assertIn("id: KC-OPC-002", content, "Must contain Knowledge Card 2")
        self.assertIn("cross_references:", content, "Knowledge cards must have cross_references")

    def test_privacy_safeguards(self):
        with open(self.readme_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("Privacy", content, "Must address privacy boundaries")
        self.assertIn("Zero Sensitive Data", content, "Must explicitly prohibit sensitive data")

if __name__ == "__main__":
    unittest.main()
