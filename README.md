# ArtAround

Progetto individuale di Tecnologie Web UniBO per visite museali personalizzate.
Comprende un backend comune, il Navigator per smartphone e l’Editor desktop.

## Componenti

| Cartella | Funzione | Tecnologie |
|---|---|---|
| `services/backend` | API, autenticazione e dati | Node.js, Express, MongoDB |
| `services/navigator` | Visita guidata per il visitatore | React, TypeScript, TanStack Router, Vite |
| `services/editor` | Gestione di musei, opere, item e visite | Vanilla JS, ES Modules, Tailwind CSS compilato |

`app/server.js` e `docker/prod/app.Dockerfile` assemblano i componenti per la
produzione. L’applicazione risultante serve il Navigator su `/`, l’Editor su
`/editor` e le API sulla stessa origine.

## Requisiti

- Docker con Docker Compose v2
- Le immagini Node e Mongo fornite dal dipartimento per il deploy finale
- Submodule inizializzati:

```bash
git submodule update --init --recursive
```

## Sviluppo locale

```bash
docker compose -f docker-compose.dev.yml up -d --build mongo backend
docker compose -f docker-compose.dev.yml run --rm backend npm run seed
API_KEY=<chiave-stampata> docker compose -f docker-compose.dev.yml up -d --build
```

- Navigator: `http://localhost:5173`
- Editor: `http://localhost:5174`
- API e Swagger: `http://localhost:3002/docs`

## Produzione: due container del dipartimento

Il deploy finale usa esclusivamente le due immagini predefinite attivate da
`gocker`: un container `node-22` per l'applicazione assemblata e un container
MongoDB. Docker Compose e i Dockerfile in questo repository restano strumenti
di sviluppo/staging locale, non il comando da eseguire sul sito di dipartimento.

La procedura completa, compresa la generazione di `source/` senza
`node_modules`, le variabili segrete, il seed e i controlli finali, è in
[docs/DEPLOY_DIPARTIMENTO.md](docs/DEPLOY_DIPARTIMENTO.md). Il Navigator riceve
configurazione same-origin e URL Editor `/editor`; la chiave API viene iniettata
dal server e non è esposta al browser.

## Documentazione

- [Architettura as-built](docs/ARCHITECTURE.md)
- [Deploy di dipartimento](docs/DEPLOY_DIPARTIMENTO.md)
- [Diagramma architetturale](docs/architecture.puml)
- [Dettagli dell’assembly Docker](docker/README.md)

I materiali di lavoro, le specifiche di corso e le note storiche restano fuori
dalla consegna e dall’immagine di produzione.
