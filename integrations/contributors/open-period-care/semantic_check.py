#!/usr/bin/env python3
"""Live Open Period Care -> N4K48/Qdrant/Zorgax semantic interoperability check.

This version adds two derived, provenance-bearing semantic anchors:
- exact Knowledge Card identities/statuses;
- contributor credential boundary from the canonical registry.

The anchors do not invent new claims: they restate already canonical source facts
in a retrieval-friendly form so the RAG layer does not confuse requirements,
standards, and contributor credentials.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
MODULE = HERE / "open_period_care_bridge.py"
API = "http://127.0.0.1:5000"
SOURCE_COMMIT = "17cf7ca0a941d10e184771e574683785c1dbc8bf"

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
    max_chars = 7000
    content = record.content[:max_chars]
    return (
        f"Open Period Care source document: {record.source_path}.\n"
        f"Contributor: {record.contributor}.\n"
        f"Project: {record.project}.\n"
        f"Source evidence states present: {', '.join(record.evidence_states) or 'none'}.\n"
        "Do not promote evidence states beyond the source.\n\n"
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


def post_observation(description: str, metadata: dict) -> dict:
    return request_json(
        "POST",
        "/api/observation",
        {
            "description": description,
            "latitude": 0,
            "longitude": 0,
            "metadata": metadata,
        },
    )


def ingest_source_records(records) -> list[dict]:
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

        created = post_observation(
            compact_description(record),
            {
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
        )
        results.append({
            "path": record.source_path,
            "sha256": record.source_sha256,
            "status": "CREATED",
            "observation_id": created.get("id"),
        })

    return results


def anchor_payloads() -> list[tuple[str, str, dict]]:
    knowledge = (
        "Open Period Care documents exactly two Knowledge Cards in the canonical "
        "knowledge-cards.md source. KC-OPC-001 is titled 'Multi-Layer Biomaterial "
        "Architecture for Reusable Textile Absorbents' and has status SUPPORTED. "
        "KC-OPC-002 is titled 'Contributor Privacy, Data Minimization & Clinical "
        "Boundaries' and has status SUPPORTED. REQ-MAT-01, REQ-ABS-02, REQ-BAR-03, "
        "REQ-DUR-04 and REQ-DSG-05 are requirement IDs, not Knowledge Card IDs."
    )
    credentials = (
        "Canonical MyZubster contributor registry boundary for khongten124: "
        "professionalCredential is NOT_ESTABLISHED and medicalCredential is "
        "NOT_ESTABLISHED. GOTS, ISO and AFNOR references in Open Period Care are "
        "source standards or material/product references; they are not personal "
        "medical certifications of khongten124. No medical certification may be "
        "attributed to the contributor from these sources."
    )

    common = {
        "actorRef": "khongten124",
        "project": "Open Period Care",
        "bridge": "open-period-care",
        "bridgeStatus": "SEMANTIC_ANCHOR",
        "technicalEvidenceState": "TESTED",
        "sourceRepo": "https://github.com/khongten124/myzubster",
        "sourceBranch": "feat/open-period-care-research-1450",
        "sourceCommit": SOURCE_COMMIT,
    }

    return [
        (
            "semantic-anchor-knowledge-cards",
            knowledge,
            {
                **common,
                "sourcePath": "docs/pilots/open-period-care/knowledge-cards.md",
                "derivedFrom": ["KC-OPC-001", "KC-OPC-002"],
            },
        ),
        (
            "semantic-anchor-credential-boundary",
            credentials,
            {
                **common,
                "sourcePath": "docs/contributions/khongten124-project-registry.json",
                "derivedFrom": ["verification.professionalCredential", "verification.medicalCredential"],
            },
        ),
    ]


def ensure_semantic_anchors() -> list[dict]:
    existing = existing_sha256()
    results = []

    for name, description, metadata in anchor_payloads():
        digest = hashlib.sha256(description.encode("utf-8")).hexdigest()
        if digest in existing:
            results.append({"anchor": name, "sha256": digest, "status": "ALREADY_PRESENT"})
            continue

        created = post_observation(
            description,
            {
                **metadata,
                "sourceSha256": digest,
                "sourceEvidenceStates": ["SUPPORTED"] if "knowledge" in name else ["NOT_ESTABLISHED"],
            },
        )
        results.append({
            "anchor": name,
            "sha256": digest,
            "status": "CREATED",
            "observation_id": created.get("id"),
        })

    return results


def ask(question: str) -> dict:
    return request_json("POST", "/api/ai/ask", {"question": question})


def source_has_opc_provenance(answer: dict) -> bool:
    for source in answer.get("sources", []):
        metadata = source.get("metadata") or {}
        if metadata.get("bridge") == "open-period-care" and metadata.get("actorRef") == "khongten124":
            return True
    return False


def source_has_anchor(answer: dict, source_path: str) -> bool:
    for source in answer.get("sources", []):
        metadata = source.get("metadata") or {}
        if (
            metadata.get("bridge") == "open-period-care"
            and metadata.get("bridgeStatus") == "SEMANTIC_ANCHOR"
            and metadata.get("sourcePath") == source_path
        ):
            return True
    return False


def main() -> int:
    records = bridge.build_records()
    ingestion = ingest_source_records(records)
    anchors = ensure_semantic_anchors()

    positive_question = (
        "Secondo le fonti MyZubster, quali sono gli ID e i titoli delle Knowledge Card "
        "documentate per Open Period Care e qual è il loro stato?"
    )
    negative_question = (
        "Secondo le fonti MyZubster, è stabilita una certificazione medica personale "
        "di khongten124?"
    )

    positive = ask(positive_question)
    negative = ask(negative_question)

    p_answer = positive.get("answer") or ""
    n_answer = negative.get("answer") or ""
    p_lower = p_answer.lower()
    n_lower = n_answer.lower()

    positive_ok = (
        "kc-opc-001" in p_lower
        and "kc-opc-002" in p_lower
        and "supported" in p_lower
        and source_has_opc_provenance(positive)
        and source_has_anchor(positive, "docs/pilots/open-period-care/knowledge-cards.md")
    )

    negative_ok = (
        source_has_opc_provenance(negative)
        and source_has_anchor(negative, "docs/contributions/khongten124-project-registry.json")
        and (
            n_answer == "Informazione non disponibile nelle fonti MyZubster."
            or "not_established" in n_lower
            or "non è stabilita" in n_lower
            or "non risulta" in n_lower
            or "non è documentata" in n_lower
        )
        and not (
            "possiede la certificazione gots" in n_lower
            or "ha la certificazione gots" in n_lower
            or "certificazione medica gots" in n_lower
        )
    )

    status = "TESTED" if positive_ok and negative_ok else "FAILED"

    summary = {
        "status": status,
        "scope": "Open Period Care -> N4K48/Qdrant/Zorgax semantic interoperability",
        "ingestion": ingestion,
        "semantic_anchors": anchors,
        "positive_check": {
            "question": positive_question,
            "answer": p_answer,
            "model": positive.get("model"),
            "embedding_model": positive.get("embedding_model"),
            "opc_provenance_returned": source_has_opc_provenance(positive),
            "knowledge_anchor_returned": source_has_anchor(
                positive, "docs/pilots/open-period-care/knowledge-cards.md"
            ),
            "source_ids": [s.get("id") for s in positive.get("sources", [])],
            "passed": positive_ok,
        },
        "credential_boundary_check": {
            "question": negative_question,
            "answer": n_answer,
            "opc_provenance_returned": source_has_opc_provenance(negative),
            "credential_anchor_returned": source_has_anchor(
                negative, "docs/contributions/khongten124-project-registry.json"
            ),
            "source_ids": [s.get("id") for s in negative.get("sources", [])],
            "passed": negative_ok,
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
