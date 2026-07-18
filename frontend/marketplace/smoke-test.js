'use strict';

// Verifica il percorso essenziale: browser/Marketplace -> proxy -> backend -> login seed.
// Non legge né espone la API key: deve essere iniettata dal proxy di serve.js.
const http = require('http');

const host = process.env.MARKETPLACE_HOST || 'localhost';
const port = Number(process.env.MARKETPLACE_PORT) || 5174;
const username = process.env.MARKETPLACE_USERNAME || 'admin';
const password = process.env.MARKETPLACE_PASSWORD || '12345678';
const body = JSON.stringify({ username, password });

function fail(message) {
  console.error(`Smoke test non superato: ${message}`);
  process.exitCode = 1;
}

const req = http.request(
  {
    hostname: host,
    port,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    let responseBody = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    res.on('end', () => {
      let payload;
      try {
        payload = responseBody ? JSON.parse(responseBody) : null;
      } catch {
        return fail(`risposta non JSON dal proxy (HTTP ${res.statusCode}).`);
      }

      if (res.statusCode !== 200) {
        const backendError = payload?.error?.message || `HTTP ${res.statusCode}`;
        return fail(`login rifiutato dal backend: ${backendError}`);
      }

      if (!payload?.token || payload?.user?.username !== username || payload?.user?.role !== 'super_admin') {
        return fail('risposta di login incompleta o utente seed non coerente.');
      }

      console.log(`Smoke test superato: login di ${username} eseguito tramite il proxy su http://${host}:${port}.`);
    });
  }
);

req.setTimeout(5000, () => {
  req.destroy(new Error('timeout di connessione al Marketplace'));
});
req.on('error', (error) => {
  fail(`Marketplace non raggiungibile su http://${host}:${port}: ${error.message}`);
});
req.write(body);
req.end();
