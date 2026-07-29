'use strict';

/** Assembla API e frontend statici nel singolo container applicativo. */

const path = require('path');
const fs = require('fs');
const express = require('express');

const { buildApp } = require('./backend/src/app');
const env = require('./backend/src/config/env');

const FRONTENDS_DIR = path.join(__dirname, 'frontends');
const NAV_DIR = path.join(FRONTENDS_DIR, 'navigator');
const MKT_DIR = path.join(FRONTENDS_DIR, 'editor');

const APP_API_KEY = process.env.APP_API_KEY || '';
const NAV_BASE_URL = process.env.NAVIGATOR_API_BASE_URL || '';
const MUSEUM_SLUG = process.env.MUSEUM_SLUG || '';
const NAVIGATOR_EDITOR_URL = process.env.NAVIGATOR_EDITOR_URL ?? '/editor';

function ensureNavigatorConfig() {
  try {
    if (!fs.existsSync(NAV_DIR)) return;

    fs.writeFileSync(
      path.join(NAV_DIR, 'api.config.json'),
      JSON.stringify({ baseUrl: NAV_BASE_URL, apiKey: '' }, null, 2)
    );

    if (MUSEUM_SLUG || NAVIGATOR_EDITOR_URL) {
      const museumCfgPath = path.join(NAV_DIR, 'museum.config.json');
      let museum = {};
      if (fs.existsSync(museumCfgPath)) {
        try {
          museum = JSON.parse(fs.readFileSync(museumCfgPath, 'utf8'));
        } catch {
          museum = {};
        }
      }
      if (MUSEUM_SLUG) museum.museumSlug = MUSEUM_SLUG;
      museum.marketplaceUrl = NAVIGATOR_EDITOR_URL;
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
    '/editor',
    express.static(MKT_DIR, { index: 'index.html', extensions: ['html'] })
  );
  app.use(express.static(NAV_DIR, { index: false }));

  // 3) Delega le API (e /health, /docs) al backend Express montato come middleware.
  app.use(backend);

  // 4) Fallback SPA: le rotte non-API tornano l'index del frontend giusto.
  app.get('/editor/*', (_req, res) => {
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
    console.log('  Editor  ->  /editor');
    console.log('  API + docs   ->  /auth, /museums, ... , /docs');
  });
}

start().catch((error) => {
  console.error('Avvio in produzione fallito', error);
  process.exit(1);
});
