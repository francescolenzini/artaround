'use strict';

/**
 * Dev server per ArtAround Marketplace/Editor.
 *
 * Due responsabilita':
 *  1. Serve i file statici dell'app (HTML/JS/CSS) dalla cartella corrente.
 *  2. Fa da reverse-proxy verso il backend (default http://localhost:3001),
 *     iniettando l'header `x-api-key` letto da serve.config.json.
 *
 * Cosi' il browser vede una sola origine -> niente problemi di CORS e la
 * api key non finisce mai nel codice client. Nessuna dipendenza npm: solo
 * moduli built-in di Node.
 *
 * Avvio:  node serve.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const CONFIG_PATH = path.join(ROOT, 'serve.config.json');
const CONFIG_EXAMPLE_PATH = path.join(ROOT, 'serve.config.example.json');

// serve.config.json contiene la API key e non e' versionato (vedi .gitignore):
// se manca (es. subito dopo un clone) si usa l'example, con key segnaposto.
const activeConfigPath = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : CONFIG_EXAMPLE_PATH;
if (activeConfigPath !== CONFIG_PATH) {
  console.warn(
    'serve.config.json non trovato: uso serve.config.example.json. ' +
      'Copialo in serve.config.json e imposta la tua apiKey.'
  );
}
const config = JSON.parse(fs.readFileSync(activeConfigPath, 'utf8'));
const PORT = Number(config.port) || 5173;
const BACKEND = new URL(config.backendUrl || 'http://localhost:3001');
const API_KEY = config.apiKey || '';

// Prefissi di path che vanno inoltrati al backend invece di servire file.
const API_PREFIXES = [
  '/auth',
  '/museums',
  '/artworks',
  '/artwork-items',
  '/visits',
  '/activities',
  '/users',
  '/api-keys',
  '/request-logs',
  '/health',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isApiPath(pathname) {
  return API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

function proxyToBackend(req, res) {
  const target = {
    protocol: BACKEND.protocol,
    hostname: BACKEND.hostname,
    port: BACKEND.port || (BACKEND.protocol === 'https:' ? 443 : 80),
    method: req.method,
    path: req.url,
    headers: {
      ...req.headers,
      host: BACKEND.host,
      'x-api-key': API_KEY,
    },
  };

  const proxyReq = http.request(target, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        error: {
          message: `Backend non raggiungibile su ${config.backendUrl}: ${err.message}`,
          status: 502,
        },
      })
    );
  });

  req.pipe(proxyReq);
}

function serveStatic(pathname, res) {
  // Normalizza ed evita path traversal.
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  // Mai esporre la config (contiene la api key) o il sorgente del server.
  const base = path.basename(filePath);
  if (base === 'serve.config.json' || base === 'serve.js') {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: rotte gestite via hash, ma se si chiede un file
      // inesistente restituiamo l'index cosi' i deep-link funzionano.
      if (err.code === 'ENOENT' && !path.extname(filePath)) {
        return serveStatic('/index.html', res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  if (isApiPath(pathname)) {
    proxyToBackend(req, res);
  } else {
    serveStatic(pathname, res);
  }
});

server.listen(PORT, () => {
  console.log(`\nArtAround Marketplace dev server`);
  console.log(`  App:     http://localhost:${PORT}`);
  console.log(`  Proxy:   /auth, /museums, ... -> ${config.backendUrl}`);
  console.log(
    `  API key: ${API_KEY ? API_KEY.slice(0, 8) + '...' : '(MANCANTE: imposta apiKey in serve.config.json)'}\n`
  );
});
