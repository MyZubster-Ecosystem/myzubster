# H4X0R — demonstrated technical capabilities

This profile section records technical capabilities demonstrated through reproducible MyZubster / N4K48 interoperability work.

## Demonstrated capabilities

- **Docker / container interoperability testing** — independently cloned, built and ran contributor software from source in an isolated Docker environment.
- **Independent software reproduction** — reproduced Nicola / N4K48's public checkpoint on MyZubster infrastructure from the public Git repository and documented the exact commit tested.
- **REST API validation** — verified container health, API responses, runtime logs and read-only flows.
- **Local AI / RAG integration** — connected the N4K48 software stack to local Ollama models, `nomic-embed-text` embeddings and Qdrant retrieval.
- **Semantic search integration** — ingested structured H4X0R evidence and successfully retrieved it through the N4K48 evidence-first RAG path.
- **Cross-project knowledge interoperability** — demonstrated that the tested N4K48 software path can operate on MyZubster / H4X0R knowledge, not only the Nicola Comics catalog.
- **Infrastructure debugging** — diagnosed and resolved Docker-to-host connectivity across Docker bridge networking, systemd service configuration, local service binding and UFW rules.
- **Security-conscious local service exposure** — kept tested services bound to loopback or a controlled Docker bridge instead of exposing development services directly to the public interface.
- **Evidence-first AI behavior testing** — verified that an unsupported personal-data question returned `Informazione non disponibile nelle fonti MyZubster.` rather than fabricating an answer.
- **Reproducible technical evidence** — recorded public provenance through GitHub issues, commit references, exact test scope and `TESTED` checkpoints.

## Verified N4K48 / H4X0R checkpoints

### 1. Independent N4K48 reproduction

Tested checkpoint:

- repository: `nicolaususnicola-lgtm/myzubster-mvp`
- branch: `pilot/n4k48-tested-checkpoint`
- commit: `87a1021`

Verified scope:

- independent Git clone;
- Docker build from source;
- isolated local deployment;
- API healthcheck;
- `GET /api/observations`;
- `GET /api/comics`;
- `POST /api/zorgax/ask`;
- HTTP 200 confirmation in runtime logs.

Public evidence:

- [Pilot Node Network #1505](https://github.com/MyZubster-Ecosystem/myzubster/issues/1505)
- [Contributor workflow #1474](https://github.com/MyZubster-Ecosystem/myzubster/issues/1474)

### 2. H4X0R semantic search through N4K48 software

A structured H4X0R evidence record was ingested through the N4K48 API and retrieved through the software's semantic-search path.

Observed test configuration:

- generation model: `zorgax:latest`
- embedding model: `nomic-embed-text`
- vector store: Qdrant
- H4X0R observation ID: `d654a6bcde1ce181`

The system correctly answered a sourced question about H4X0R and the N4K48 reproduction test, returned the supporting source record, and declined to invent a telephone number that was not present in the indexed evidence.

Status:

`TESTED` — H4X0R knowledge ingestion, embedding, semantic retrieval and evidence-first answering through the N4K48 software stack on MyZubster infrastructure.

## Professional summary

> Able to integrate and test independent software on Linux/Docker infrastructure, connect local AI and vector-database services, validate API/RAG evidence-first workflows, troubleshoot container-to-host networking and document reproducible technical results with public provenance.

## Evidence boundary

These checkpoints demonstrate the exact technical activities above. They do **not** mean that H4X0R developed the entire N4K48 software stack, and they do not establish direct peer-to-peer exchange with Nicola's physical computer, automatic repository synchronization, production certification, scientific validation, professional licensing or third-party institutional endorsement.
