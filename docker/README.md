# `docker/prod/app.Dockerfile` — dettagli implementativi

Questo file approfondisce **come** è costruita l'immagine di produzione
assemblata. Per la panoramica generale, l'avvio (dev/prod) e i diagrammi di
topologia, vedi il [README principale](../README.md).

## Perché l'assembly vive qui e non in un submodule

Nessuno dei tre submodule applicativi (`artaround-backend`,
`artaround-marketplace`/Marketplace, `artaround-navigator`/Navigator) sa di essere,
in produzione, composto insieme agli altri due in un solo processo. Ognuno
resta un progetto autonomo con la propria singola responsabilità (vedi il
README di ciascuno). La composizione è un problema che appartiene solo a
**questo** repo (artaround): per questo `app/server.js` e `app/package.json`
vivono qui, non in `services/backend`.

## Layout dentro l'immagine

```
/srv/                          (WORKDIR)
├── server.js                  # da app/server.js di QUESTO repo
├── node_modules/               # solo "express" (da app/package.json)
├── backend/
│   ├── node_modules/            # dipendenze di produzione del backend (npm ci --omit=dev)
│   └── src/                     # da services/backend/app/src/ — invariato
└── frontends/
    ├── navigator/                # build statica Vite (da services/navigator/app, stage navigator-build)
    └── marketplace/              # statici vanilla (da services/marketplace/app, solo i file serviti)
```

`server.js` fa `require('./backend/src/app')` e `require('./backend/src/config/env')`:
la risoluzione dei moduli di Node risale la gerarchia di cartelle da lì, trova
`./backend/node_modules/` e risolve correttamente `express`, `mongoose`,
`dotenv`, ecc. — **senza bisogno di alcun hoisting manuale**. Il `node_modules`
di primo livello (`/srv/node_modules/express`) serve solo per l'`express`
usato direttamente da `server.js` come app esterna che monta il backend.

## Cosa NON viene copiato del Marketplace

Solo gli asset serviti (`index.html`, `app.js`, `api.js`, `constants.js`,
`components/`, `pages/`, `styles/`). **Non** viene copiato `serve.js` (è il
dev server/proxy del submodule standalone — qui la sua funzione, l'iniezione
di `x-api-key`, la svolge `server.js` di questo repo per tutti e tre i
componenti) né `serve.config.json`/`smoke-test.js`.

## Nessun lockfile per `app/`

`app/package.json` ha una sola dipendenza (`express`) ma non ha un
`package-lock.json` committato (va generato con `npm install` la prima volta
che si ha accesso alla rete, o lasciato generare al build: il Dockerfile usa
già il pattern `if [ -f package-lock.json ]; then npm ci; else npm install; fi`,
coerente con gli altri Dockerfile del progetto).

## Sostituire le immagini con quelle del dipartimento

I tecnici forniscono le **immagini base** (una Node/Express, una Mongo) a
versioni fissate; non è ammesso proporre immagini custom:

1. In `docker/prod/app.Dockerfile` sostituisci i tag `FROM node:20-alpine`
   (entrambi gli stage: `navigator-build` e `runtime`) con l'immagine Node
   fornita. Se non è adatta al build stage del Navigator, esegui `npm run build`
   dentro il loro container Node e copia `dist/` in `frontends/navigator/`.
2. Sostituisci `mongo:7` con la loro immagine Mongo in `docker-compose.prod.yml`.
3. Segui "Come attivare i docker di dipartimento" per porte/routing reali.
