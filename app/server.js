'use strict';

/**
 * Entry-point del container di PRODUZIONE assemblato da artaround.
 *
 * Vincolo di consegna (docs/knowledge-base.md): il deploy avviene su DUE soli
 * container del dipartimento — uno con Node/Express, uno con Mongo. Non c'è
 * spazio per un container Nginx separato che serva i due frontend: qui
 * "l'equivalente" (docs/ARCHITECTURE.md: "build statica servita da Nginx o
 * equivalente") è questo stesso processo Node.
 *
 * Questo file NON appartiene a nessuno dei tre submodule applicativi — vive
 * qui perché la sua unica responsabilità è la composizione, non la logica di
 * dominio di alcuna delle tre app:
 *   - artaround-backend  resta a singola responsabilità: "solo API"
 *     (services/backend/app/server.js), senza sapere nulla dei frontend.
 *   - artaround-marketplace (Marketplace) e artaround-navigator (Navigator) restano
 *     applicazioni client generiche, ignare di essere servite da un backend
 *     Express esterno invece che dai propri dev server (serve.js / vite).
 *
 * Cosa fa, in ordine:
 *   1. Richiede `buildApp()` dal backend (services/backend/app/src/app.js,
 *      copiato in ./backend/ nell'immagine) e lo monta come sub-app Express:
 *      ZERO modifiche al codice del backend.
 *   2. Inietta `x-api-key` lato server su ogni richiesta priva dell'header:
 *      né il Navigator né il Marketplace la espongono mai nel browser.
 *   3. Serve gli statici di Navigator (build Vite) alla radice e quelli del
 *      Marketplace (vanilla JS) sotto /marketplace, con fallback SPA per il
 *      routing lato client di entrambi.
 *
 * Percorsi serviti (singola origine):
 *   /              Navigator (fallback SPA su index.html)
 *   /marketplace   Marketplace/Editor (fallback su index.html, routing hash)
 *   /auth /museums /artworks /artwork-items /visits /activities /users
 *   /api-keys /request-logs /health /docs   -> backend (buildApp)
 *
 * Variabili d'ambiente rilevanti:
 *   PORT                     porta in ascolto (default 3001, da src/config/env.js)
 *   APP_API_KEY              API key applicativa iniettata sulle richieste API
 *   NAVIGATOR_API_BASE_URL   baseUrl scritto nell'api.config.json del Navigator
 *                            (vuoto = stessa origine; è il default corretto qui)
 *   MUSEUM_SLUG              slug museo scritto nel museum.config.json (opzionale)
 *   + tutte le variabili già usate da services/backend/app/src/config/env.js
 *     (MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, SWAGGER_USER, SWAGGER_PASSWORD)
 */

const path = require('path');
const fs = require('fs');
const express = require('express');

const { buildApp } = require('./backend/src/app');
const env = require('./backend/src/config/env');

const FRONTENDS_DIR = path.join(__dirname, 'frontends');
const NAV_DIR = path.join(FRONTENDS_DIR, 'navigator');
const MKT_DIR = path.join(FRONTENDS_DIR, 'marketplace');

const APP_API_KEY = process.env.APP_API_KEY || '';
const NAV_BASE_URL = process.env.NAVIGATOR_API_BASE_URL || ''; // "" => stessa origine
const MUSEUM_SLUG = process.env.MUSEUM_SLUG || '';

/**
 * api.config.json contiene un segreto: non è nel build del Navigator (Vite non
 * lo genera). Lo si scrive al boot dalle env — baseUrl vuoto perché tutto è
 * same-origin qui; apiKey vuota perché la chiave la inietta il middleware
 * server-side, mai il client.
 */
function ensureNavigatorConfig() {
  try {
    if (!fs.existsSync(NAV_DIR)) return;

    fs.writeFileSync(
      path.join(NAV_DIR, 'api.config.json'),
      JSON.stringify({ baseUrl: NAV_BASE_URL, apiKey: '' }, null, 2)
    );

    if (MUSEUM_SLUG) {
      const museumCfgPath = path.join(NAV_DIR, 'museum.config.json');
      let museum = {};
      if (fs.existsSync(museumCfgPath)) {
        try {
          museum = JSON.parse(fs.readFileSync(museumCfgPath, 'utf8'));
        } catch {
          museum = {};
        }
      }
      museum.museumSlug = MUSEUM_SLUG;
      fs.writeFileSync(museumCfgPath, JSON.stringify(museum, null, 2));
    }
  } catch (err) {
    console.warn('[main] Impossibile generare la config del Navigator:', err.message);
  }
}

/** Inietta la API key applicativa se la richiesta non ne porta già una. */
function injectApiKey(req, _res, next) {
  if (APP_API_KEY && !req.headers['x-api-key']) {
    req.headers['x-api-key'] = APP_API_KEY;
  }
  next();
}

async function start() {
  if (!APP_API_KEY) {
    console.warn(
      '[main] ATTENZIONE: APP_API_KEY non impostata. Le chiamate API dei frontend ' +
        'falliranno con 401 finché non esegui il seed e imposti APP_API_KEY.'
    );
  }

  ensureNavigatorConfig();

  // App backend esistente (API + /health + /docs + errorHandler), invariata.
  const backend = await buildApp();

  const app = express();

  // 1) Iniezione server-side della API key (prima di delegare al backend).
  app.use(injectApiKey);

  // 2) Asset statici dei frontend.
  app.use(
    '/marketplace',
    express.static(MKT_DIR, { index: 'index.html', extensions: ['html'] })
  );
  app.use(express.static(NAV_DIR, { index: false }));

  // 3) Delega le API (e /health, /docs) al backend Express montato come middleware.
  app.use(backend);

  // 4) Fallback SPA: le rotte non-API tornano l'index del frontend giusto.
  app.get('/marketplace/*', (_req, res) => {
    res.sendFile(path.join(MKT_DIR, 'index.html'));
  });
  app.get('*', (_req, res) => {
    const navIndex = path.join(NAV_DIR, 'index.html');
    if (fs.existsSync(navIndex)) return res.sendFile(navIndex);
    res.status(404).json({ error: { message: 'Not found', status: 404 } });
  });

  app.listen(env.port, () => {
    console.log(`ArtAround (produzione, assemblato) in ascolto su :${env.port}`);
    console.log('  Navigator    ->  /');
    console.log('  Marketplace  ->  /marketplace');
    console.log('  API + docs   ->  /auth, /museums, ... , /docs');
  });
}

start().catch((error) => {
  console.error('Avvio in produzione fallito', error);
  process.exit(1);
});
