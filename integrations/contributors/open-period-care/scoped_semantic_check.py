#!/usr/bin/env python3
"""Contributor-scoped semantic interoperability check for Open Period Care.

Why this exists:
N4K48's default /api/ai/ask searches one shared Qdrant collection without a
contributor filter. In a mixed collection, unrelated H4X0R records can outrank
Open Period Care records. This check keeps the shared collection but applies a
Qdrant payload filter for bridge=open-period-care before authoritative answers.
"""

from __future__ import annotations

import json
import os
import urllib.request

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://172.22.0.1:11434").rstrip("/")
QDRANT_URL = os.environ.get("QDRANT_URL", "http://127.0.0.1:6333").rstrip("/")
QDRANT_COLLECTION = os.environ.get("QDRANT_COLLECTION", "myzubster")
EMBED_MODEL = os.environ.get("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
GEN_MODEL = os.environ.get("OLLAMA_MODEL", "zorgax:latest")


def post_json(url: str, payload: dict, timeout: int = 180) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def embed(text: str) -> list[float]:
    data = post_json(
        f"{OLLAMA_BASE_URL}/api/embed",
        {"model": EMBED_MODEL, "input": text},
    )
    embeddings = data.get("embeddings")
    if not embeddings or not embeddings[0]:
        raise RuntimeError("No embedding returned by Ollama")
    return embeddings[0]


def scoped_search(question: str, limit: int = 5) -> list[dict]:
    vector = embed(question)
    data = post_json(
        f"{QDRANT_URL}/collections/{QDRANT_COLLECTION}/points/query",
        {
            "query": vector,
            "filter": {
                "must": [
                    {
                        "key": "observation.metadata.bridge",
                        "match": {"value": "open-period-care"},
                    }
                ]
            },
            "limit": limit,
            "with_payload": True,
        },
    )
    points = (data.get("result") or {}).get("points") or []
    return [
        ((point.get("payload") or {}).get("observation") or {})
        for point in points
        if ((point.get("payload") or {}).get("observation"))
    ]


def find_card(card_id: str) -> tuple[dict | None, list[dict]]:
    results = scoped_search(
        f"Open Period Care khongten124 {card_id} Knowledge Card title status"
    )
    for obs in results:
        metadata = obs.get("metadata") or {}
        if metadata.get("knowledgeCardId") == card_id:
            return obs, results
    return None, results


def find_credential_boundary() -> tuple[dict | None, list[dict]]:
    results = scoped_search(
        "Open Period Care khongten124 medicalCredential professionalCredential "
        "personal medical certification NOT_ESTABLISHED"
    )
    for obs in results:
        metadata = obs.get("metadata") or {}
        if metadata.get("sourcePath") == "docs/contributions/khongten124-project-registry.json":
            return obs, results
    return None, results


def generate_scoped_summary(question: str, sources: list[dict]) -> str:
    context = "\n".join(
        f"[FONTE {i}] description={s.get('description','')} "
        f"metadata={json.dumps(s.get('metadata') or {}, ensure_ascii=False, sort_keys=True)}"
        for i, s in enumerate(sources, 1)
    )
    data = post_json(
        f"{OLLAMA_BASE_URL}/api/chat",
        {
            "model": GEN_MODEL,
            "stream": False,
            "keep_alive": "10m",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Sei Zorgax in modalità evidence-first. Usa solo le FONTI "
                        "Open Period Care fornite. Non inventare, non promuovere stati "
                        "di evidenza e non attribuire standard o certificazioni di "
                        "materiale come credenziali personali. Se manca un fatto, "
                        "rispondi: Informazione non disponibile nelle fonti MyZubster."
                    ),
                },
                {"role": "user", "content": f"{context}\n\nDOMANDA: {question}"},
            ],
        },
    )
    return ((data.get("message") or {}).get("content") or "").strip()


def main() -> int:
    card1, card1_results = find_card("KC-OPC-001")
    card2, card2_results = find_card("KC-OPC-002")
    credential, credential_results = find_credential_boundary()

    card1_ok = bool(
        card1
        and card1.get("description")
        == "KC-OPC-001 — Multi-Layer Biomaterial Architecture for Reusable Textile Absorbents. Stato: SUPPORTED."
    )
    card2_ok = bool(
        card2
        and card2.get("description")
        == "KC-OPC-002 — Contributor Privacy, Data Minimization & Clinical Boundaries. Stato: SUPPORTED."
    )

    credential_description = (credential or {}).get("description", "")
    credential_ok = bool(
        credential
        and "medicalCredential is NOT_ESTABLISHED" in credential_description
        and "not personal medical certifications" in credential_description
    )

    # Zorgax free-form check runs only on contributor-scoped sources.
    scoped_sources = []
    seen = set()
    for source in card1_results + card2_results + credential_results:
        sid = source.get("id")
        if sid and sid not in seen:
            seen.add(sid)
            scoped_sources.append(source)
    scoped_sources = scoped_sources[:5]

    zorgax_answer = generate_scoped_summary(
        "Quali sono le due Knowledge Card Open Period Care e qual è il confine "
        "sulle certificazioni personali di khongten124?",
        scoped_sources,
    )
    lower = zorgax_answer.lower()
    zorgax_ok = (
        "kc-opc-001" in lower
        and "kc-opc-002" in lower
        and "supported" in lower
        and (
            "non_established" in lower
            or "non è stabilita" in lower
            or "non risult" in lower
            or "non document" in lower
        )
        and "gots" not in lower.replace("non ", "")
    )

    all_sources_opc = all(
        (s.get("metadata") or {}).get("bridge") == "open-period-care"
        for s in scoped_sources
    )

    status = "TESTED" if card1_ok and card2_ok and credential_ok and zorgax_ok and all_sources_opc else "FAILED"

    print(json.dumps({
        "status": status,
        "scope": "Contributor-scoped Open Period Care -> Qdrant -> Zorgax interoperability",
        "qdrant_filter": "observation.metadata.bridge = open-period-care",
        "knowledge_cards": [
            {
                "id": "KC-OPC-001",
                "retrieved_observation_id": (card1 or {}).get("id"),
                "description": (card1 or {}).get("description"),
                "passed": card1_ok,
            },
            {
                "id": "KC-OPC-002",
                "retrieved_observation_id": (card2 or {}).get("id"),
                "description": (card2 or {}).get("description"),
                "passed": card2_ok,
            },
        ],
        "credential_boundary": {
            "retrieved_observation_id": (credential or {}).get("id"),
            "passed": credential_ok,
        },
        "zorgax_scoped_answer": {
            "answer": zorgax_answer,
            "passed": zorgax_ok,
        },
        "all_returned_sources_are_open_period_care": all_sources_opc,
        "source_ids": [s.get("id") for s in scoped_sources],
        "models": {
            "embedding": EMBED_MODEL,
            "generation": GEN_MODEL,
        },
        "boundary": (
            "TESTED applies to contributor-scoped technical retrieval and answering only. "
            "It does not establish medical, clinical, laboratory, regulatory or professional credentials."
        ),
    }, ensure_ascii=False, indent=2, sort_keys=True))

    return 0 if status == "TESTED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
