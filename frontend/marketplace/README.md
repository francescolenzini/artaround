# ArtAround — Marketplace / Editor

Web app per PC (vanilla JS + HTML + CSS, **senza framework SPA**, Tailwind via CDN) con cui
autori e amministratori creano e curano i contenuti (musei, opere, item, visite) prima della
visita. Consuma il backend Node/Express/MongoDB su `http://localhost:3002`.

## Avvio

1. **Backend** (in `../../backend`):
   ```bash
   npm install
   npm run seed     # popola il DB e stampa la API key di bootstrap
   npm run dev      # avvia su :3002 con nodemon (PORT=3002)
   ```
   Copia la **API key** stampata dal seed.

2. **Dev server del frontend** (questa cartella):
   ```bash
   cp serve.config.example.json serve.config.json   # poi incolla la apiKey
   node serve.js
   ```
   Apri `http://localhost:5174`.

   > `serve.config.json` contiene la API key e **non è versionato** (`.gitignore`): parti dal file
   > `serve.config.example.json`. Se rilanci `npm run seed` la chiave cambia: aggiorna `apiKey`.
   > Se avvii senza `serve.config.json`, `serve.js` usa l'example (key segnaposto → il login fallirà
   > finché non imposti quella reale).

### Perché un dev server

Il backend non abilita CORS e non va modificato. `serve.js` (Node puro, zero dipendenze):

- serve i file statici dell'app;
- fa da **reverse-proxy** verso `:3002` per i path API, **iniettando l'header `x-api-key`**.

Così il browser vede una sola origine (niente CORS) e la API key non finisce nel codice client:
il frontend gestisce solo il JWT (`Authorization: Bearer …`).

## Account demo

`admin` (super_admin), `autore1`/`autore2`/`visitatore1`/`visitatore2` (museum_curator) —
password `12345678` per tutti.

## Struttura

```
serve.js / serve.config.json   dev server + proxy + config (apiKey, backendUrl, port)
index.html                     shell: login + app shell (sidebar/topbar/<main>)
app.js                         auth gate + router hash-based + guard ruolo/museo
api.js                         client HTTP unico (header, 401→login, errori uniformi)
constants.js                   enum del backend per le select
components/                    sidebar, topbar, table (paginazione), modal+form, toast, ui
pages/                         *.html (skeleton) + *.js (logica) per ogni schermata
styles/main.css                override minimi su Tailwind
```

Routing hash: `#/museums`, `#/museums/:id`, `#/content`, `#/content/:id`, `#/visits`,
`#/visits/:id`, `#/users` (solo super_admin).

## Nota: fix applicato al backend

Durante l'integrazione è emerso che **ogni scrittura (POST/PUT) restituiva HTTP 500**:
`backend/src/middleware/requestLogger.js` chiamava `sanitizeOutput()` in modo sincrono sul
documento Mongoose idratato dentro l'override di `res.json`, andando in ricorsione infinita
(il GET non era colpito perché usa `.lean()`). È stato applicato un fix minimo e a basso
rischio: le chiamate di sanitizzazione sono avvolte in `try/catch` (un middleware di logging
non deve mai far fallire la richiesta). Vedi `safeSanitize` in quel file.
