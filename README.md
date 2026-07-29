# ArtAround

Progetto individuale di Tecnologie Web UniBO per visite museali personalizzate.
Comprende un backend comune, il Navigator per smartphone e l’Editor desktop.

## Componenti

| Cartella | Funzione | Tecnologie |
|---|---|---|
| `services/backend` | API, autenticazione e dati | Node.js, Express, MongoDB |
| `services/navigator` | Visita guidata per il visitatore | React, TypeScript, TanStack Router, Vite |
| `services/editor` | Gestione di musei, opere, item e visite | Vanilla JS, ES Modules, Tailwind CDN |

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

## Produzione: due container

Il deployment usa esclusivamente:

1. un container Node/Express che serve API, Navigator statico ed Editor statico;
2. un container MongoDB con volume persistente.

Prima del deploy sostituire in `docker/prod/app.Dockerfile` e
`docker-compose.prod.yml` le immagini di esempio con quelle comunicate dal
dipartimento. Copiare `.env.prod.example` in `.env.prod`, impostare segreti
robusti e procedere:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d mongo
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm app npm run seed
# Copiare la chiave stampata in APP_API_KEY dentro .env.prod.
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Il Navigator riceve al boot configurazione same-origin e URL Editor `/editor`;
la chiave API viene iniettata dal server e non è esposta al browser.

## Documentazione

- [Architettura as-built](docs/ARCHITECTURE.md)
- [Diagramma architetturale](docs/architecture.puml)
- [Dettagli dell’assembly Docker](docker/README.md)

I materiali di lavoro, le specifiche di corso e le note storiche restano fuori
dalla consegna e dall’immagine di produzione.
