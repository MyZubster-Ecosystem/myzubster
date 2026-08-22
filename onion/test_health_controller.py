import unittest

from onion.health_controller import HealthController, HealthState, Observation


class HealthControllerTests(unittest.TestCase):
    def test_single_failed_vantage_does_not_mark_node_unreachable(self):
        c = HealthController()
        c.record(Observation("node-a", "rimini-wifi", 100.0, False, "onion_connect"), now=100.0)
        self.assertNotEqual(c.nodes["node-a"].state, HealthState.UNREACHABLE)

    def test_independent_failures_can_mark_node_unreachable(self):
        c = HealthController(min_observers_for_global_unreachable=2)
        c.record(Observation("node-a", "observer-1", 100.0, False, "onion_connect"), now=100.0)
        node = c.record(Observation("node-a", "observer-2", 100.0, False, "onion_connect"), now=100.0)
        self.assertEqual(node.state, HealthState.UNREACHABLE)

    def test_repeated_failure_quarantines(self):
        c = HealthController(quarantine_after=3)
        for i in range(3):
            node = c.record(Observation("node-a", "observer-1", 100.0 + i, False, "application_timeout"), now=100.0 + i)
        self.assertEqual(node.state, HealthState.QUARANTINED)
        self.assertGreater(node.quarantine_until, 102.0)

    def test_success_recovers_node(self):
        c = HealthController()
        for i in range(3):
            c.record(Observation("node-a", "observer-1", 100.0 + i, False, "application_timeout"), now=100.0 + i)
        node = c.record(Observation("node-a", "observer-2", 200.0, True, "application_ok"), now=200.0)
        self.assertNotEqual(node.state, HealthState.UNREACHABLE)


if __name__ == "__main__":
    unittest.main()
