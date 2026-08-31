function clean(value, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

function component(id, name, purpose, searchQuery, compatibility, safety = null) {
  return { id, name, purpose, search_query: searchQuery, compatibility, safety };
}

function isEvaBuildIntent(input) {
  const text = clean(input).toLowerCase();
  return /eva[\s-]*ioni/.test(text) && /(costru|assembl|progett|robot|telemetr|irrig|sensor|orto|ambient)/.test(text);
}

function createEvaBuildPlan(input) {
  const goal = clean(input) || 'Costruire EVA IONI come piattaforma robotica ambientale modulare';
  const components = [
    component('controller', 'Controller principale', 'Controllo, telemetria e interfacce sensori', 'ESP32-S3 development board industrial robot', 'Verificare GPIO, I2C/UART, tensioni logiche, watchdog e disponibilità di interfacce richieste.'),
    component('motor-driver', 'Driver motori', 'Pilotare la base mobile', 'dual motor driver encoder robot 12V high current', 'Corrente continua e di picco del driver devono superare quelle dei motori; prevedere protezioni e arresto controllato.'),
    component('motors', 'Motori con encoder', 'Movimento e odometria', '12V DC gear motor encoder robot', 'Tensione, corrente di stallo, rapporto di riduzione e fissaggi devono essere coerenti con telaio e driver.'),
    component('environment-sensors', 'Sensori ambientali', 'Temperatura, umidità e pressione/qualità ambientale', 'BME280 SHT31 environmental sensor I2C', 'Verificare intervallo operativo, precisione, protezione da condensa e compatibilità I2C.'),
    component('soil-sensor', 'Sensore umidità suolo', 'Monitoraggio irriguo', 'capacitive soil moisture sensor waterproof analog I2C', 'Preferire sensori capacitivi/protetti; calibrare sul terreno reale e separare la misura da decisioni automatiche non validate.'),
    component('irrigation-interface', 'Interfaccia irrigazione', 'Comando a bassa tensione di elettrovalvola o pompa esterna', '12V solenoid valve relay MOSFET module optoisolated', 'Dimensionare tensione/corrente, protezione flyback e isolamento. Nessuna attuazione autonoma prima di test e autorizzazione umana.', 'Usare uscita fail-safe normalmente disattivata; prevedere override manuale e arresto di emergenza.'),
    component('battery', 'Batteria protetta', 'Alimentazione mobile', '12V protected battery pack BMS certified robot', 'Capacità e corrente devono coprire motori, elettronica e picchi con margine.', 'Preferire pacchi completi con BMS/protezioni; non assemblare celle litio sciolte senza competenza e attrezzatura professionale.'),
    component('regulator', 'Convertitore DC-DC', 'Alimentazione stabile dell’elettronica', 'buck converter 12V 5V 5A protected', 'Ingresso sopra la massima tensione batteria; uscita e corrente adatte a controller e sensori.'),
    component('emergency-stop', 'Arresto di emergenza', 'Interrompere in modo fisico l’energia agli attuatori', 'emergency stop switch DC robot 12V contactor', 'Deve interrompere la catena di potenza degli attuatori indipendentemente dal software.', 'L’arresto di emergenza deve essere accessibile, testato e non dipendere dal controllo software.'),
    component('chassis', 'Telaio + ruote', 'Struttura meccanica', 'metal robot chassis 4wd outdoor encoder', 'Portata, protezione, baricentro e fissaggi devono sostenere batteria, sensori e cablaggio.'),
    component('wiring', 'Cablaggio, fusibili e connettori', 'Distribuzione elettrica protetta', 'inline fuse XT60 connector wire kit robot', 'Sezione cavi, connettori e fusibili devono essere dimensionati alla corrente massima.', 'Proteggere la linea batteria con fusibile vicino alla sorgente e separare potenza attuatori da logica/sensori.')
  ];

  return {
    type: 'eva_ioni_robot',
    title: 'EVA IONI — robot ambientale modulare v1',
    goal,
    generated_by: 'zorgax-eva-build-planner-v1',
    architecture: [
      'sensori ambiente/suolo → controller → telemetria/provenance',
      'controller → driver motori → base mobile con encoder',
      'controller → interfaccia fail-safe → irrigazione a bassa tensione',
      'batteria protetta → fusibile → E-stop → attuatori',
      'batteria protetta → DC-DC → controller + sensori'
    ],
    components,
    steps: [
      'Congelare requisiti v1: massa, autonomia, terreno, sensori, frequenza telemetria e limiti dell’irrigazione.',
      'Validare in simulazione schema dati, telemetria, provenance, watchdog, timeout e stato fail-safe.',
      'Assemblare e testare a banco solo controller, sensori e registrazione dati; nessun attuatore collegato.',
      'Validare alimentazione, fusibili, DC-DC ed E-stop con limitazione di corrente e carichi controllati.',
      'Integrare base mobile e testare un motore/sottosistema alla volta in area chiusa e controllata.',
      'Integrare l’interfaccia irrigazione con carico di prova prima di collegare pompa/elettrovalvola reale.',
      'Verificare override manuale, arresto di emergenza, perdita comunicazione, sensore guasto e riavvio sicuro.',
      'Solo dopo review umana autorizzare un test fisico limitato con logging completo e criteri di stop predefiniti.'
    ],
    checks: [
      'corrente di stallo motori',
      'tensione logica e alimentazioni',
      'fusibili e protezioni',
      'E-stop indipendente dal software',
      'watchdog e timeout comunicazione',
      'calibrazione sensori',
      'fail-safe irrigazione',
      'override manuale',
      'temperature driver/regolatori',
      'provenance e riproducibilità telemetria'
    ],
    safety_boundary: 'Zorgax progetta e produce sourcing/evidenza. Non acquista componenti, non attiva pagamenti e non autorizza da solo attuazioni fisiche. Test fisici e decisioni conseguenziali richiedono review umana.',
    marketplace_queries: components.map(item => ({ component_id: item.id, query: item.search_query }))
  };
}

module.exports = { isEvaBuildIntent, createEvaBuildPlan };
