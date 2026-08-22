#!/usr/bin/env python3
"""Small, dependency-free controller for distributed Onion health observations.

This module deliberately does not equate one failed probe with a dead node.
Observations are scoped to an observer/vantage point and aggregate into a
bounded health score. It can be embedded in a larger discovery service.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from time import time
from typing import Dict, Iterable, Optional


class HealthState(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNREACHABLE = "UNREACHABLE"
    QUARANTINED = "QUARANTINED"


@dataclass(frozen=True)
class Observation:
    node_id: str
    observer_id: str
    observed_at: float
    ok: bool
    layer: str
    latency_ms: Optional[float] = None


@dataclass
class NodeHealth:
    node_id: str
    score: float = 50.0
    state: HealthState = HealthState.DEGRADED
    consecutive_failures: int = 0
    quarantine_until: float = 0.0
    observers: Dict[str, Observation] = field(default_factory=dict)


class HealthController:
    """Aggregate independent observations without treating one vantage point as truth."""

    def __init__(
        self,
        quarantine_after: int = 3,
        quarantine_seconds: int = 300,
        min_observers_for_global_unreachable: int = 2,
    ) -> None:
        self.quarantine_after = quarantine_after
        self.quarantine_seconds = quarantine_seconds
        self.min_observers_for_global_unreachable = min_observers_for_global_unreachable
        self.nodes: Dict[str, NodeHealth] = {}

    def record(self, observation: Observation, now: Optional[float] = None) -> NodeHealth:
        now = time() if now is None else now
        node = self.nodes.setdefault(observation.node_id, NodeHealth(observation.node_id))
        node.observers[observation.observer_id] = observation

        if observation.ok:
            node.score = min(100.0, node.score + 15.0)
            node.consecutive_failures = 0
            if now >= node.quarantine_until:
                node.quarantine_until = 0.0
                node.state = HealthState.HEALTHY if node.score >= 70 else HealthState.DEGRADED
        else:
            node.score = max(0.0, node.score - 20.0)
            node.consecutive_failures += 1
            if node.consecutive_failures >= self.quarantine_after:
                node.quarantine_until = max(node.quarantine_until, now + self.quarantine_seconds)
                node.state = HealthState.QUARANTINED
            else:
                node.state = HealthState.DEGRADED

        self._reconcile_global_state(node, now)
        return node

    def _reconcile_global_state(self, node: NodeHealth, now: float) -> None:
        if node.quarantine_until > now:
            node.state = HealthState.QUARANTINED
            return

        recent = [o for o in node.observers.values() if now - o.observed_at <= 180]
        independent_failures = sum(1 for o in recent if not o.ok)
        independent_successes = sum(1 for o in recent if o.ok)

        # A single Wi-Fi/NAT/captive-portal vantage point cannot globally kill a node.
        if independent_failures >= self.min_observers_for_global_unreachable and independent_successes == 0:
            node.state = HealthState.UNREACHABLE
        elif independent_successes > 0:
            node.state = HealthState.HEALTHY if node.score >= 70 else HealthState.DEGRADED
        else:
            node.state = HealthState.DEGRADED

    def healthy_candidates(self, node_ids: Iterable[str], now: Optional[float] = None) -> list[str]:
        now = time() if now is None else now
        result = []
        for node_id in node_ids:
            node = self.nodes.get(node_id)
            if node and node.state == HealthState.HEALTHY and node.quarantine_until <= now:
                result.append(node_id)
        return result
