# ArtAround Backend

Backend Node.js + Express + MongoDB derivato dai mock del frontend, con requisiti enterprise:

- data model completo per domini applicativi e infrastrutturali
- autenticazione con APIKEY + JWT su endpoint API
- multi tenant su singolo database (super_admin e museum_curator)
- logging centralizzato su collection Mongo dedicata
- documentazione OpenAPI 3.0.3 e UI Swagger protetta da Basic Authentication
- esecuzione Docker in DEV con hot reload

## Stack tecnologico

- Node.js 20
- Express 4
- MongoDB 7 + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Swagger UI Express

## Struttura progetto backend

- `backend/server.js`: bootstrap server
- `backend/src/app.js`: configurazione app Express
- `backend/src/config`: configurazioni env/db
- `backend/src/models`: schema Mongo (business + infrastruttura)
- `backend/src/middleware`: auth, logging, error handling, Basic Auth Swagger
- `backend/src/routes`: endpoint REST
- `backend/src/docs/openapi.js`: specifica OpenAPI
- `backend/src/scripts/seed.js`: seeding iniziale
- `backend/src/scripts/apikey-cli.js`: gestione API key da console
- `backend/docker/docker-compose.yml`: stack DEV con hot reload

## Data model MongoDB

### Collezioni business

1. `museums`
2. `users`
3. `artworks`
4. `artworkitems`
5. `visits`
6. `activities`

### Collezioni infrastrutturali

1. `apikeys`
2. `requestlogs`

### Note mapping dai mock FE

- Il campo applicativo `id` (es. `mus-1`, `usr-2`) e mantenuto in ogni documento come chiave esterna leggibile.
- `_id` Mongo rimane disponibile internamente.
- Le relazioni tra entita usano gli `id` applicativi per coerenza con i mock frontend.

## Sicurezza

## 1) API key

- Header richiesto: `x-api-key`
- Le chiavi sono salvate solo come hash SHA-256 (`keyHash`) + prefisso per riconoscimento.
- Stato chiave: `active | disabled`.
- Gestione da console tramite script dedicato.

## 2) JWT utente

- Header richiesto: `Authorization: Bearer <token>`
- Endpoint login: `POST /auth/login` (richiede gia API key valida)
- JWT contiene `sub` (id utente) e ruolo.

## 3) Swagger UI protetta

- UI docs disponibile su `/docs`
- Accesso consentito solo con Basic Authentication.
- Credenziali configurabili via env: `SWAGGER_USER`, `SWAGGER_PASSWORD`.

## Multi tenant (single database)

- Tutti i tenant condividono lo stesso database MongoDB.
- Ruoli:
1. `super_admin`: accesso completo a tutti i dati.
2. `museum_curator`: accesso solo ai musei in `assignedMuseumIds`.
- I filtri tenant sono applicati lato API su listing e operazioni CRUD.

## Logging centralizzato richieste

Middleware globale salva un record su `requestlogs` per ogni richiesta:

- utente che ha eseguito l'operazione (`userId`, `username`)
- data creazione richiesta (`requestCreatedAt`)
- data fine richiesta (`requestCompletedAt`)
- tempo totale (`totalTimeMs`)
- payload in ingresso (`requestPayload`) con masking dati sensibili
- payload in uscita (`responsePayload`) con serializzazione sicura

### Mascheramento dati sensibili

Chiavi sensibili (`password`, `token`, `authorization`, `apikey`, ecc.) vengono salvate come stringa `masked-data`.

### Gestione stream in output

Se la risposta e un buffer/stream non viene persistito il contenuto completo:

- per buffer: solo metadati (tipo e dimensione)
- per stream/risposta non catturabile: metadato sintetico (`stream-or-empty`)

## OpenAPI e documentazione endpoint

Specifica completa in `backend/src/docs/openapi.js` (OpenAPI 3.0.3).

Endpoint documentati:

- `GET /health`
- `POST /auth/login`
- CRUD `museums`
- CRUD `artworks`
- CRUD `artwork-items`
- CRUD `visits`
- `GET/POST activities`
- `GET/POST/PATCH users`
- `GET/POST /api-keys` e `POST /api-keys/{prefix}/disable`
- `GET /request-logs`

Sicurezze OpenAPI configurate:

- `ApiKeyAuth` (header `x-api-key`)
- `BearerAuth` (JWT)

## Paginazione server-side centralizzata

Tutti gli endpoint lista implementano un layer unico di paginazione lato server.

Endpoint lista coperti:

- `GET /museums`
- `GET /artworks`
- `GET /artwork-items`
- `GET /visits`
- `GET /activities`
- `GET /users`
- `GET /api-keys`
- `GET /request-logs`

Parametri query supportati:

- `page` (default: `1`)
- `pageSize` (default: `20`)
- `sortBy` (campo ordinabile specifico dell'endpoint)
- `sortOrder` (`asc` | `desc`)
- `q` (ricerca testuale sui campi configurati)
- `filters` (JSON object opzionale per filtri aggiuntivi)
- parametri query addizionali non riservati (trattati come filtri equality/in)

Formato risposta lista:

```json
{
	"data": [],
	"pagination": {
		"page": 1,
		"pageSize": 20,
		"totalItems": 0,
		"totalPages": 1,
		"hasNextPage": false,
		"hasPreviousPage": false
	},
	"sort": {
		"by": "createdAt",
		"order": "desc"
	},
	"filters": {}
}
```

## Avvio in locale (senza Docker)

Prerequisiti:

- Node.js >= 20
- MongoDB raggiungibile

Passi:

1. Copiare `.env.example` in `.env` e configurare valori.
2. Installare dipendenze in `backend`.
3. Eseguire seed dati.
4. Avviare backend in dev.

Comandi:

```bash
cd backend
npm install
npm run seed
npm run dev
```

## Avvio Docker DEV con hot reload

Il progetto include compose in `backend/docker/docker-compose.yml` con:

- mount del sorgente su container
- `nodemon --legacy-watch`
- polling attivo per filesystem su Windows
- MongoDB con healthcheck

Comandi:

```bash
cd backend/docker
docker compose up --build
```

Servizi:

- API: `http://localhost:3001`
- Swagger UI: `http://localhost:3001/docs`
- MongoDB: `localhost:27017`

## Gestione API key da console

Da cartella `backend`:

Generazione:

```bash
npm run apikey -- generate --name=dev-key --createdBy=usr-1
```

Disabilitazione:

```bash
npm run apikey -- disable --prefix=abcd1234 --disabledBy=usr-1
```

Lista:

```bash
npm run apikey -- list
```

## Credenziali seed iniziali

Utenti seed:

- `arossi` (super_admin)
- `mbianchi` (museum_curator)
- `lverdi` (museum_curator)

Password iniziale: `ChangeMe123!`

Il seed stampa anche una API key bootstrap in console.

## Header richiesti per le API protette

- `x-api-key: <api-key-value>`
- `Authorization: Bearer <jwt-token>`

## Checklist requisiti richiesti

1. Backend Node.js + Express + MongoDB: completato.
2. Data model completo: completato.
3. Swagger/OpenAPI completo: completato.
4. Logging centralizzato con masking e timing: completato.
5. Multi tenant single DB con super_admin/museum_curator: completato.
6. Accesso endpoint via APIKEY + JWT: completato.
7. Gestione API key da console: completato.
8. Swagger UI protetta Basic Auth: completato.
9. Docker DEV hot reload: completato.
