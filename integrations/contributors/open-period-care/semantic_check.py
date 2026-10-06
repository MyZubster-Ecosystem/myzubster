#!/usr/bin/env python3
"""Live Open Period Care -> N4K48/Qdrant/Zorgax semantic interoperability check.

Prerequisites:
- N4K48 API listening on http://127.0.0.1:5000
- N4K48 API configured with working Ollama embeddings + Qdrant
"""

from __future__ import annotations

import importlib.util
import json
import sys
import urllib.error
import urllib.request
from dataclasses import asdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
MODULE = HERE / "open_period_care_bridge.py"
API = "http://127.0.0.1:5000"

spec = importlib.util.spec_from_file_location("open_period_care_bridge", MODULE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Unable to load bridge module from {MODULE}")
bridge = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = bridge
spec.loader.exec_module(bridge)


def request_json(method: str, path: str, payload: dict | None = None) -> dict:
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} -> HTTP {exc.code}: {body}") from exc


def compact_description(record) -> str:
    # Keep enough source text for semantic retrieval while remaining friendly to
    # local embedding context windows. Provenance and exact source hash live in metadata.
    max_chars = 7000
    content = record.content[:max_chars]
    return (
        f"Open Period Care source document: {record.source_path}.\n"
        f"Contributor: {record.contributor}.\n"
        f"Project: {record.project}.\n"
        f"Source evidence states present in this document: {', '.join(record.evidence_states) or 'none'}.\n"
        f"Source content follows. Evidence states must not be promoted beyond the source.\n\n"
        f"{content}"
    )


def existing_sha256() -> set[str]:
    payload = request_json("GET", "/api/observations")
    values = set()
    for item in payload.get("observations", []):
        metadata = item.get("metadata") or {}
        digest = metadata.get("sourceSha256")
        if digest:
            values.add(digest)
    return values


def ingest(records) -> list[dict]:
    existing = existing_sha256()
    results = []

    for record in records:
        if record.source_sha256 in existing:
            results.append({
                "path": record.source_path,
                "sha256": record.source_sha256,
                "status": "ALREADY_PRESENT",
            })
            continue

        payload = {
            "description": compact_description(record),
            "latitude": 0,
            "longitude": 0,
            "metadata": {
                "actorRef": "khongten124",
                "project": "Open Period Care",
                "bridge": "open-period-care",
                "bridgeStatus": "READ_ONLY_NORMALIZED",
                "technicalEvidenceState": "TESTED",
                "technicalTestScope": "MyZubster public evidence fetch + normalization + semantic ingestion",
                "sourceRepo": record.source_repo,
                "sourceBranch": record.source_branch,
                "sourceCommit": record.source_commit,
                "sourcePath": record.source_path,
                "sourceSha256": record.source_sha256,
                "sourceEvidenceStates": record.evidence_states,
            },
        }
        created = request_json("POST", "/api/observation", payload)
        results.append({
            "path": record.source_path,
            "sha256": record.source_sha256,
            "status": "CREATED",
            "observation_id": created.get("id"),
        })

    return results


def ask(question: str) -> dict:
    return request_json("POST", "/api/ai/ask", {"question": question})


def source_has_opc_provenance(answer: dict) -> bool:
    for source in answer.get("sources", []):
        metadata = source.get("metadata") or {}
        if (
            metadata.get("bridge") == "open-period-care"
            and metadata.get("actorRef") == "khongten124"
            and metadata.get("sourceCommit") == "17cf7ca0a941d10e184771e574683785c1dbc8bf"
        ):
            return True
    return False


def main() -> int:
    records = bridge.build_records()
    ingestion = ingest(records)

    positive_question = (
        "Secondo le fonti MyZubster, quali Knowledge Card sono documentate "
        "per Open Period Care e qual è il loro stato?"
    )
    negative_question = "Quale certificazione medica possiede khongten124?"

    positive = ask(positive_question)
    negative = ask(negative_question)

    positive_ok = bool(positive.get("answer")) and source_has_opc_provenance(positive)
    negative_ok = (
        negative.get("answer") == "Informazione non disponibile nelle fonti MyZubster."
        and source_has_opc_provenance(negative)
    )

    status = "TESTED" if positive_ok and negative_ok else "FAILED"

    summary = {
        "status": status,
        "scope": "Open Period Care -> N4K48/Qdrant/Zorgax semantic interoperability",
        "ingestion": ingestion,
        "positive_check": {
            "question": positive_question,
            "answer": positive.get("answer"),
            "model": positive.get("model"),
            "embedding_model": positive.get("embedding_model"),
            "opc_provenance_returned": source_has_opc_provenance(positive),
            "source_ids": [s.get("id") for s in positive.get("sources", [])],
        },
        "negative_check": {
            "question": negative_question,
            "answer": negative.get("answer"),
            "expected": "Informazione non disponibile nelle fonti MyZubster.",
            "opc_provenance_returned": source_has_opc_provenance(negative),
            "source_ids": [s.get("id") for s in negative.get("sources", [])],
        },
        "boundary": (
            "TESTED applies to technical ingestion/retrieval and evidence-first answering. "
            "It does not establish medical, clinical, laboratory, regulatory or professional credentials."
        ),
    }

    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if status == "TESTED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
