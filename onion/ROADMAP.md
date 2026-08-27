# Distributed Onion Roadmap

## Vision

Evolvere il MyZubster Onion Service da singola istanza Docker a una rete di Onion Service distribuiti, verificabili e intercambiabili, capace di mantenere il servizio disponibile quando singoli nodi o percorsi di rete falliscono o vengono sovraccaricati.

## Fase 0 — Fondazione

- [x] Dockerizzazione Onion Service
- [x] identità Tor v3 persistente
- [x] isolamento della rete
- [x] Probe Agent
- [x] schema Discovery
- [x] schema Health Observation
- [x] health state machine
- [x] documentazione di handoff PC

## Fase 1 — Nodo singolo verificabile

- [ ] deploy reale di Node A
- [ ] endpoint applicativo/health verificabile via Onion
- [ ] probe Tor end-to-end
- [ ] verifica da rete mobile 4G/5G
- [ ] test restart/recreate con identità persistente
- [ ] test backup/restore dell'identità

## Fase 2 — Multi-node

- [ ] deploy Node B
- [ ] deploy Node C
- [ ] identità Onion indipendenti
- [ ] candidate registry
- [ ] advertisement firmati
- [ ] expiry e sequence anti-stale
- [ ] capability discovery

## Fase 3 — Health distribuito

- [ ] Observer indipendenti
- [ ] osservazioni multi-vantage-point
- [ ] health scoring
- [ ] quorum/aggregazione delle osservazioni
- [ ] distinzione tra failure del nodo e failure della rete dell'observer
- [ ] quarantine temporanea
- [ ] recovery automatico

## Fase 4 — Failover

- [ ] candidate pool lato client
- [ ] bounded retries
- [ ] exponential backoff + jitter
- [ ] selezione del nodo sano
- [ ] esclusione temporanea dei nodi degradati
- [ ] reintegro automatico dei nodi recuperati
- [ ] test Node A down -> servizio ancora disponibile via B/C

## Fase 5 — Resilienza DDoS

- [ ] rate limiting
- [ ] connection/resource limits
- [ ] protezione contro retry storm
- [ ] discovery ridondante
- [ ] diversificazione delle reti/host
- [ ] rotazione controllata dei punti di ingresso
- [ ] test di carico controllati

## Fase 6 — Trust e sicurezza

- [ ] identità crittografiche dei nodi
- [ ] advertisement firmati
- [ ] verifica anti-replay
- [ ] key rotation
- [ ] revocation
- [ ] segregazione delle chiavi Onion
- [ ] audit trail
- [ ] security review

## Fase 7 — Produzione

- [ ] deployment automatizzato
- [ ] monitoring
- [ ] alerting
- [ ] backup/restore verificati
- [ ] rolling replacement
- [ ] disaster recovery
- [ ] security assessment
- [ ] runbook operativo

## Fase 8 — Integrazione MyZubster

- [ ] integrazione Gateway
- [ ] Registry
- [ ] Payment/Verifier
- [ ] AI services
- [ ] service capabilities
- [ ] routing per servizio
- [ ] governance dei nodi

## Milestone operative

### M1 — Node A online

Un Onion Service reale è raggiungibile end-to-end da un observer esterno e mantiene la propria identità dopo restart/recreate.

### M2 — A/B/C online

Tre nodi reali, con identità indipendenti e candidate discovery funzionante.

### M3 — Health distribuito

Almeno due vantage point indipendenti possono produrre osservazioni e il sistema non dichiara globalmente down un nodo sulla base di una singola rete.

### M4 — Failover verificato

Lo spegnimento di Node A non interrompe il servizio: il traffico passa a un candidato sano.

### M5 — Resilienza

Il sistema gestisce degrado, quarantine e recovery senza retry storm e senza dipendere da un singolo discovery authority.

## Principio architetturale

`discover -> verify -> observe -> score -> select -> failover -> recover`

La reachability osservata da una singola rete, inclusi Wi-Fi pubblico o rete mobile, è una misura locale e non deve essere interpretata come prova di outage globale.
