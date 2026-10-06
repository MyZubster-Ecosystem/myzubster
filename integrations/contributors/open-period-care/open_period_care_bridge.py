#!/usr/bin/env python3
"""Read-only Open Period Care -> MyZubster contributor bridge.

This adapter fetches the canonical public Open Period Care research artifacts,
preserves source provenance, and emits normalized MyZubster knowledge records.

It deliberately does not promote evidence states. A source marked SUPPORTED
remains SUPPORTED; absence of accredited verification remains explicit.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import urllib.request
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Callable, Iterable

ROOT = Path(__file__).resolve().parents[3]
REGISTRY_PATH = ROOT / "docs" / "contributions" / "khongten124-project-registry.json"

RAW_BASE = "https://raw.githubusercontent.com/khongten124/myzubster/feat/open-period-care-research-1450/docs/pilots/open-period-care"
SOURCES = (
    ("README.md", f"{RAW_BASE}/README.md"),
    ("evidence-matrix.md", f"{RAW_BASE}/evidence-matrix.md"),
    ("knowledge-cards.md", f"{RAW_BASE}/knowledge-cards.md"),
)

ALLOWED_STATES = {"PROPOSED", "SUPPORTED", "TESTED", "VERIFIED"}


@dataclass(frozen=True)
class KnowledgeRecord:
    schema: str
    contributor: str
    project: str
    source_repo: str
    source_branch: str
    source_commit: str
    source_path: str
    source_url: str
    source_sha256: str
    evidence_states: list[str]
    content: str
    bridge_status: str = "READ_ONLY_NORMALIZED"


def _fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "MyZubster-Open-Period-Care-Bridge/1.0"},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.read().decode("utf-8")


def _states(text: str) -> list[str]:
    found = {token for token in re.findall(r"\b[A-Z][A-Z_]+\b", text) if token in ALLOWED_STATES}
    return sorted(found)


def load_registry(path: Path = REGISTRY_PATH) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(
    *,
    registry: dict,
    source_path: str,
    source_url: str,
    content: str,
) -> KnowledgeRecord:
    project = registry["project"]
    return KnowledgeRecord(
        schema="myzubster.contributor-knowledge-record.v1",
        contributor=registry["contributor"]["github"],
        project=project["canonicalName"],
        source_repo=project["repository"],
        source_branch=project["branch"],
        source_commit=project["commit"],
        source_path=source_path,
        source_url=source_url,
        source_sha256=hashlib.sha256(content.encode("utf-8")).hexdigest(),
        evidence_states=_states(content),
        content=content,
    )


def build_records(fetcher: Callable[[str], str] = _fetch) -> list[KnowledgeRecord]:
    registry = load_registry()
    records: list[KnowledgeRecord] = []
    for source_path, source_url in SOURCES:
        content = fetcher(source_url)
        records.append(
            normalize(
                registry=registry,
                source_path=source_path,
                source_url=source_url,
                content=content,
            )
        )
    return records


def emit_jsonl(records: Iterable[KnowledgeRecord]) -> None:
    for record in records:
        print(json.dumps(asdict(record), ensure_ascii=False, sort_keys=True))


def main() -> int:
    try:
        emit_jsonl(build_records())
    except Exception as exc:  # pragma: no cover - CLI boundary
        print(f"bridge_error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
