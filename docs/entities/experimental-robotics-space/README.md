# Experimental Robotics / EVA / Space

## Scopo
Raccoglie i track sperimentali hardware/software: Robot, Robot Stack, EVA IONI, Space Station e integrazioni IoT/telemetria.

## Repository collegati
`MyZubster-Robot`, `MyZubster-Robot-Stack`, `EVA-IONI`, `myzubster-space-station`.

## Stato
Prototipo/simulazione/integrazione sperimentale. I nomi dei repository non provano l'esistenza di infrastrutture fisiche operative o deployment reali.

## Input → Output
Telemetria, simulazione e comandi autorizzati → stato software, dati sperimentali e integrazioni controllate.

## Sicurezza
Separare simulazione da hardware reale; nessun controllo di attuatori critici senza autorizzazione, interlock e test; non pubblicare dettagli sensibili di infrastruttura o accessi.

## Evidenza richiesta
Log/test riproducibili, indicazione chiara `SIMULATION`, `PROTOTYPE` o `HARDWARE_VERIFIED`, e provenance di ogni dato reale.

## Definition of done
Ogni capacità dichiarata è associata al suo ambiente reale di test e non viene promossa da simulazione a deployment senza prova fisica verificabile.
