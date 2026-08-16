# 🚀 MyZubster Space Station MVP

Space Station è il sistema centrale di MyZubster per la gestione di missioni, telemetria, dashboard e integrazione con il gateway e i pagamenti.

---

## 📌 Stato del progetto

Questo repository contiene il **codice sorgente** e la **documentazione** del MVP di Space Station.

- **Backend**: Express.js + MongoDB
- **Test**: Jest + Supertest
- **Simulatore**: Eva Ioni (Python)
- **Dashboard**: UI web (React / HTML + JS)
- **Gateway**: Integrazione con MyZubster Gateway
- **Payments**: XMR / MYZ (simulazione + reale)

---

## 📂 Struttura del repository
myzubster-space-station/
├── backend/ # API e logica di business
│ ├── src/
│ │ ├── models/ # Modelli MongoDB
│ │ ├── routes/ # Endpoint API
│ │ ├── services/ # Servizi (geocoding, telemetry, ecc.)
│ │ └── index.js # Entry point del server
│ └── tests/ # Test di integrazione
├── dashboard/ # UI web (React o HTML/JS)
├── simulator/ # Eva Ioni Simulator (Python)
├── gateway/ # Integrazione con Gateway
├── docs/ # Documentazione aggiuntiva
└── README.md # Questo file
text


---

## 🚀 Avvio rapido

### Prerequisiti

- Node.js (v20+)
- MongoDB (locale o Atlas)
- Python 3 (per il simulatore, opzionale)

### Installazione

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster-space-station.git
cd myzubster-space-station
npm install

Variabili d'ambiente

Crea un file .env nella root:
env

PORT=5003
MONGODB_URI=mongodb://localhost:27017/myzubster
NODE_ENV=development

Avvio del server
bash

node backend/src/index.js

Avvio del simulatore Eva Ioni (opzionale)
bash

python simulator/eva_ioni_simulator.py

Dashboard (opzionale)
bash

cd dashboard
npm start

📡 API principali
Endpoint	Metodo	Descrizione
/health	GET	Stato del servizio
/api/telemetry	POST	Invia telemetria
/api/telemetry	GET	Recupera telemetria
/api/gardens	CRUD	Gestione orti (esempio)
/api/gateway	POST	Integrazione Gateway
🧪 Test
bash

NODE_ENV=test npm test

Per eseguire solo i test del backend:
bash

NODE_ENV=test npx jest backend/tests/ --runInBand

🌱 Bounties

Il progetto MyZubster sostiene 5 bounty attive, formalizzate come issue pubbliche nel repository principale.
Originale	GitHub Issue	Titolo	Ricompensa	Stato
#001	#390	Eva Ioni Simulator	250 MYZ	AVAILABLE
#002	#391	Space Station Telemetry System	250 MYZ	AVAILABLE
#003	#392	Space Station Telemetry Dashboard	250 MYZ	AVAILABLE
#004	#393	Gateway API Integration	250 MYZ	AVAILABLE
#005	#394	MYZ/XMR Payment Integration	250 MYZ	AVAILABLE

Una bounty non è considerata pagata semplicemente perché l'issue è stata chiusa o la PR mergiata. Il pagamento deve essere separatamente registrato e verificabile.

Per dettagli sul processo di bounty, consulta il file BOUNTIES.md nel repository principale.
📖 Documentazione aggiuntiva

    BOUNTIES.md – Processo bounty

    CONTRIBUTING.md – Linee guida per contribuire

    API Documentation – Dettaglio endpoint (WIP)

🤝 Contribuire

Siamo aperti a contributi! Segui la guida in CONTRIBUTING.md e consulta le issue aperte.
📜 Licenza

[Specificare la licenza, es. MIT]
⚠️ Nota importante

Questo è un progetto MVP in fase di sviluppo. Alcune funzionalità potrebbero essere simulate o in memoria. Non utilizzare in produzione senza opportuna verifica.

