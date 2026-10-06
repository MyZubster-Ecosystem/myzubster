# MyZubster — indice delle evidenze per il 12 ottobre 2026

Preparato il 6 ottobre 2026. Scaletta di lavoro per Daniel / h4x0r e Nicola / N4K48. Orario, modalità e sede dell'incontro devono essere confermati con gli organizzatori; questo documento non attesta una collaborazione universitaria già avviata.

## Obiettivo dell'incontro

Mostrare come un contributo possa conservare autore, fonte, revisione, conoscenza associata e stato di verifica. Proporre un piccolo protocollo di valutazione riproducibile con l'università, da concordare, distinguendo software funzionante, ricerca documentata e validazione esterna.

## Casi e fonti da mostrare

| Caso | Evidenza disponibile | Cosa dimostra | Limite da dichiarare |
|---|---|---|---|
| Nicola / N4K48 | [Matrice interoperabilità](../contributors/CONTRIBUTOR-INTEROPERABILITY-MATRIX.md), [profilo](../NICOLA_LORENZINI_LIFE.md), [caso operativo](participant-automation/NICOLA_CASE_STUDY.md) | Percorso di consenso e contributi; la matrice registra test circoscritti di nodo Docker, API e recupero semantico | Il profilo storico contiene stati participant-reported e verifiche pendenti. Portare gli output dei test con commit/ambiente; non presentare ogni funzione come verificata |
| Kefir | Caso pratico di scambio riferito dai partecipanti, da accompagnare con evidenza minimizzata del Marketplace | Possibile esempio comprensibile del percorso comunità → scambio → conoscenza | In questo indice non è stata acquisita una prova primaria dello scambio. Prima della demo aggiungere fonte e consenso; nessuna validazione biologica o sanitaria implicita |
| Open Period Care — khongten124 | [PR #1451](https://github.com/MyZubster-Ecosystem/myzubster/pull/1451), [collegamento canonico](../contributions/khongten124-canonical-project-link.md) | Ricerca documentata, fonti, requisiti e Knowledge Cards KC-OPC-001 / KC-OPC-002 | Le conoscenze sono SUPPORTED; non sono certificazioni mediche o prove di prodotto clinicamente validato |
| Circular Care / Evidence Payload | [PR #1489](https://github.com/MyZubster-Ecosystem/myzubster/pull/1489), [protocollo](ventures/CIRCULAR-CARE-EVIDENCE-PAYLOAD-V1.md) | Provenienza, payload JSON, serializzazione e verifica di integrità SHA-256 | Un hash e un riferimento blockchain non dimostrano riciclo fisico o efficacia del materiale |
| Wasim / wasim-builds | [PR #1513](https://github.com/MyZubster-Ecosystem/myzubster/pull/1513), [registro #1512](https://github.com/MyZubster-Ecosystem/myzubster/issues/1512#issuecomment-6014255144) | Bug di onboarding corretto da un contributor esterno e consenso al personaggio registrato | Personaggio PROPOSED; Knowledge Node, Passport pubblicato e test end-to-end non sono dedotti dal merge |
| Calcolo economico — edvinas1573 | [PR #1507](https://github.com/MyZubster-Ecosystem/myzubster/pull/1507) | Proposta di ripartizione esatta con aritmetica intera e test mirati | PR draft/open, gate in coda al controllo. Calcolo soltanto: non crea fondi, pagamenti o percentuali commerciali attive |

## Percorso dimostrativo — 15 minuti

1. **Due minuti:** problema della provenienza delle conoscenze e introduzione del caso kefir, con fonte disponibile.
2. **Quattro minuti:** aprire #1451 e le due Knowledge Cards; mostrare una relazione fonte → requisito → stato SUPPORTED.
3. **Tre minuti:** aprire Evidence Payload v1; eseguire il verificatore documentato sul payload canonico, mostrando ambiente, commit, risultato e hash atteso/ottenuto.
4. **Tre minuti:** mostrare il checkpoint indipendente di Nicola con log riproducibili; usare TESTED solo per il comportamento effettivamente testato.
5. **Tre minuti:** mostrare attribuzione dei contributi di Wasim e khongten124, stato del Passport e proposta di un piccolo test universitario.

Se un endpoint non risponde, presentare il checkpoint documentato con la sua data e dichiarare che la verifica live non è stata completata.

## Contributor Passport e Knowledge Graph

Il [percorso dei nodi contributor](../CONTRIBUTOR-PILOT-NODES.md) separa contributo accettato, evidenza, Knowledge Card, Passport opt-in e nodo indipendente. Il [collegamento canonico di khongten124](../contributions/khongten124-canonical-project-link.md) registra l'approvazione del contributor ma lascia pendente l'URL della Knowledge Card pubblicata nel suo account. Mostrare questi stati esplicitamente, senza promuovere una scheda preparata a Passport pubblicato.

## Blockchain e decentralizzazione

Presentare l'architettura e gli eventuali test come checkpoint delimitati. Per affermare un ancoraggio on-chain eseguito servono rete, contratto/attestazione, txid e confronto del digest. La sola presenza di schema, indirizzo o riferimento testnet non basta. Un nodo indipendente dimostra il comportamento riprodotto in quell'ambiente; non prova che tutti i componenti dell'ecosistema siano decentralizzati.

## Verifiche prima dell'incontro

- Confermare direttamente modalità, orario e presenza dei partecipanti.
- Recuperare la prova minimizzata del caso kefir e i log/commit dei test di Nicola.
- Eseguire il verificatore sul payload corrente e conservare output e comando.
- Controllare la raggiungibilità dei link e degli endpoint che saranno mostrati.
- Verificare se la pubblicazione account-side della Knowledge Card / Passport è completata; mantenere PENDING quando manca.
- Aggiornare lo stato #1507 soltanto dopo i risultati dei gate.
- Concordare con l'università un obiettivo misurabile, protocollo, responsabile e criterio di successo; nessuna adesione è presunta.

## Stato operativo dei reward

Il contributo di Jay44333 per #1443 è accettato tramite #1470. L'[ultimo aggiornamento pubblico](https://github.com/MyZubster-Ecosystem/myzubster/issues/1443#issuecomment-6007316070) segnala fondi BTC insufficienti per reward e fee. Questo indice non verifica il wallet e non attesta un payout. Prima di nuove promesse di reward, coprire gli impegni già maturati e registrare riferimento di conversione, timestamp, fee e txid quando il pagamento avviene.
