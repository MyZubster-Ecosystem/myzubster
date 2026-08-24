# MyZubster Entity READMEs

Questa cartella raccoglie un README sintetico per ogni entità funzionale principale dell'ecosistema MyZubster, ricavata dalla mappa canonica in `docs/ECOSYSTEM.md`.

Ogni README chiarisce: scopo, repository/componenti collegati, stato, input/output, dipendenze, confini di sicurezza, evidenza richiesta e definition of done.

## Entità

- [Core / Platform](core-platform/README.md)
- [MyZubster App](app/README.md)
- [Web / TV](web-tv/README.md)
- [Garden / Orto](garden/README.md)
- [Character / Metaverse](character-metaverse/README.md)
- [Observations](observations/README.md)
- [Bounties / Rewards](bounties-rewards/README.md)
- [Gateway / Settlement](gateway-settlement/README.md)
- [Marketplace](marketplace/README.md)
- [Animal Registry](animal-registry/README.md)
- [Zorgax](zorgax/README.md)
- [Automation / Agents](automation-agents/README.md)
- [Public Evidence / IPFS](public-evidence-ipfs/README.md)
- [Documentation / Manuals](docs-manuals/README.md)
- [Experimental Robotics / EVA / Space](experimental-robotics-space/README.md)

## Regola di maturità

Usare sempre stati espliciti: `DOCUMENTED`, `IMPLEMENTED`, `CI_VERIFIED`, `DEVICE_VERIFIED`, `DEPLOYED`, `PRODUCTION_READY`, `ADOPTED`.

Un README descrive un confine e non prova da solo che la funzione sia operativa in produzione.

## Source of truth

In caso di conflitto: comportamento verificato da codice/test → `docs/ECOSYSTEM.md` → README dell'entità → documentazione storica.
