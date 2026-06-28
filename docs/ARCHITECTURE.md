# ArtAround - Architettura del Sistema

ArtAround è il progetto del corso di Tecnologie Web (UniBO, A.A. 2025/26): una suite di applicazioni per la visita personalizzata a musei. Il sistema prevede due applicazioni client distinte (**Navigator** per la visita in museo, **Marketplace/Editor** per la preparazione dei contenuti) appoggiate a un backend comune Node.js/Express/MongoDB.

> Per il riassunto completo delle specifiche del docente, lo stato di avanzamento rispetto ad esse e i gap aperti, vedi [`knowledge-base.md`](knowledge-base.md). Questo documento descrive **come è fatto il sistema** (as-built + pianificato), non le regole d'esame.

## Stato del progetto a colpo d'occhio

| Componente | Stato | Note |
|---|---|---|
| Backend API (Express + MongoDB) | ✅ Implementato | Auth, RBAC, multi-tenant, logging, paginazione, Swagger, test |
| ArtAround Navigator (app smartphone) | 🚧 Da realizzare | Richiede framework JS/TS (React/Vue/Angular/Svelte) |
| ArtAround Marketplace/Editor (app PC) | 🚧 Da realizzare | Richiede vanilla JS/TS (no framework; ok Web Components/Alpine/HTMX) |
| Dati di seed conformi alla consegna | 🚧 Parziale | Seed attuale molto sotto i minimi richiesti (vedi knowledge-base.md) |
| Estensione 18-27 (visite sincronizzate) | 🚧 Non iniziata | |
| Estensione 18-33 (geolocalizzazione/QR + LLM) | 🚧 Non iniziata | |

## Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| Runtime | Node.js | >= 20 (Docker: `node:20-alpine`) |
| Framework backend | Express.js | 4.21.2 |
| Database | MongoDB | 7 (via Mongoose 8.13.2) |
| Autenticazione | jsonwebtoken + bcryptjs | jsonwebtoken 9.0.2, bcryptjs 3.0.2 |
| Documentazione | swagger-ui-express + OpenAPI 3.0.3 | 5.0.1 |
| Testing | Jest + supertest + mongodb-memory-server | Jest 30.3, supertest 7.2.2, mongodb-memory-server 11.0.1 |
| Container | Docker Compose | Mongo 7 + Node 20 |
| Frontend Navigator (pianificato) | TypeScript + framework a scelta (React/Vue/Angular/Svelte) | — |
| Frontend Marketplace/Editor (pianificato) | TypeScript vanilla (Web Components/Alpine/HTMX ok, no framework SPA) | — |
| Frontend (stato attuale) | Solo contratto di tipi (`frontend/index.ts`) + dataset mock (`frontend/mockData.ts`) | — |

**Vincolo hard del docente**: il backend deve restare nell'ecosistema Node (no PHP/Perl/Python/Java/Ruby/MySQL/Deno). Il Navigator richiede un framework JS/TS. Il Marketplace/Editor deve restare vanilla JS/TS senza framework SPA. Vedi `knowledge-base.md` per i dettagli completi.

## Componenti Principali (Backend)

### 1. Middleware Pipeline

Ordine esatto definito in `backend/src/app.js` (`buildApp()`):

1. `express.json({ limit: '2mb' })` — body parser con limite 2MB
2. `requestLogger` — log su MongoDB con correlation ID, timing, masking dati sensibili
3. `GET /health` — liveness check, nessuna auth, risponde `{ status: 'ok' }`
4. Rotte documentazione protette da `protectSwagger` (Basic Auth):
   - `GET /docs/openapi.json` — spec scaricabile come allegato
   - `GET /docs` — Swagger UI
   - `GET /docs-json` — spec come risposta JSON
5. Tutte le rotte applicative (vedi sotto), protette da `requireApiKeyAndJwt`
6. `errorHandler` — catch-all, risposta JSON standardizzata: `{ error: { message, status } }`

`requireApiKeyAndJwt` esegue in sequenza `requireApiKey` (header `x-api-key`, hash SHA-256 contro `ApiKey.keyHash`, deve essere `status: 'active'`) e `requireJwt` (header `Authorization: Bearer <token>`, verifica firma, payload `{ sub, role }`, utente deve esistere con `status: 'active'`). Il fallimento di uno qualsiasi dei due step ritorna 401 prima di proseguire.

`requireRole(...roles)` è un middleware aggiuntivo applicato per-rotta dove serve restringere a `super_admin` (es. `/users`, `/api-keys`, `/request-logs`).

### 2. Dominio Business (6 entità)

Ogni modello usa `versionKey: false` (niente `__v`) e timestamp automatici (`createdAt`/`updatedAt`).

- **Museum** (`backend/src/models/Museum.js`) — profilo museo: `id`, `name`, `shortName`, `slug` (univoco), `status` (`draft|active|archived`), `logo`, `coverImage`, descrizioni, `city/address/postalCode/country` (campi piatti, non annidati), contatti, `openingHours[]` (`day/openingHour/closingHour`), `ticketInfo`, `accessibilityNotes`, `services[]`, `defaultLanguage`, `supportedLanguages[]`, `assignedCuratorIds[]`, contatori viewmodel (`itemsCount`, `visitsCount`, `publishedCount`)
- **Artwork** (`Artwork.js`) — opera base: `id`, `museumId`, `universalObjectId` (univoco, sparse), `title`, `artist`, `year`, `category`, `style`, `materials[]`, `dimensions{width,height,depth,unit}`, `description`, `assets[]` (`type/source/description`), `tags[]`, `status` (`draft|published|archived`)
- **ArtworkItem** (`ArtworkItem.js`) — contenuto multilingua/multi-registro di un'opera (il vero "item" delle specifiche): `id`, `artworkId`, `classification.fruitionLength` (enum `3s|15s|40s|1min|4min`), `classification.languageRegister` (enum `infantile|elementare|medio|avanzato|specialistico`), `classification.languageCode`, `classification.targetDurationSeconds`, `content.title`, `content.rendering.supportsScreen/supportsTTS`, `content.screenText`, `content.ttsText`, `images[]` (`id/source/caption`), `license`, `isFree`, `price{value,currency}`, `status` (`draft|published`), `creatorId`, `lastUpdaterId`
- **Visit** (`Visit.js`) — percorso guidato: `id`, `museumId`, `title`, `slug`, `subtitle`, `description`, `targetAudience`, `estimatedDurationMinutes`, `authorId`, `status` (`draft|published|archived`), `steps[]` con `visitStep { id, type (enum logistics_intro|main_item|optional_item|transition), title, description, directionsFromPrevious, itemId, order }`
- **User** (`User.js`) — utenti con ruoli: `id`, `fullName`, `email` (univoco), `username` (univoco), `passwordHash` (bcryptjs), `role` (enum `super_admin|museum_curator`), `status` (`active|invited|suspended|archived`), `assignedMuseumIds[]`, `lastLogin`
- **Activity** (`Activity.js`) — audit log: `id`, `userId`, `action`, `entityType` (enum `museum|artwork|item|visit|user`), `entityId`, `entityName`, `museumId` (opzionale), `timestamp`, `details`

### 3. Infrastruttura (2 entità)

- **ApiKey** (`ApiKey.js`) — `name`, `prefix` (univoco, primi 8 char), `keyHash` (SHA-256 dell'intera chiave, univoco), `status` (`active|disabled`), `createdByUserId`, `disabledByUserId`, `disabledAt`, `lastUsedAt`. Metodo statico `ApiKey.hashValue(value)`.
- **RequestLog** (`RequestLog.js`) — `method`, `path`, `statusCode`, `userId`, `username`, `apiKeyPrefix`, `tenantScope[]`, `requestCreatedAt`, `requestCompletedAt`, `totalTimeMs`, `requestPayload`/`responsePayload` (Mixed, sanitizzati), `ip`, `userAgent`, `correlationId`

### 4. Multi-Tenancy

Single-database con filtro a livello applicativo (`backend/src/services/tenant.js`):

- `canAccessMuseum(user, museumId)`: `true` se `role === 'super_admin'`, altrimenti `true` solo se `museumId` è in `user.assignedMuseumIds`
- `scopedMuseumFilter(user)`: ritorna `{}` per super_admin, `{ id: { $in: assignedMuseumIds } }` per curator, `{ id: '__forbidden__' }` se utente assente

Applicato in tutte le rotte CRUD su Museum/Artwork/ArtworkItem/Visit/Activity (per ArtworkItem il filtro passa attraverso un lookup sugli Artwork del curator quando manca un `museumId` esplicito in query).

### 5. Servizi Trasversali

- **Pagination Service** (`backend/src/services/pagination.js`, `paginateQuery()`) — paginazione server-side unificata. Parametri: `page` (default 1), `pageSize` (default 20, max 100), `sortBy`/`sortOrder` (con alias `-campo` per discendente), `q`/`queryString`/`search` (regex case-insensitive sui `searchableFields`), `filters` (JSON) + parametri query liberi non riservati trattati come filtri equality/`$in` (array, CSV o `$in` automatico). Risposta sempre nella forma `{ data, pagination, sort, filters }`.
- **Tenant Scoping** — vedi sopra
- **ID Generator** (`backend/src/services/ids.js`, `generateEntityId(prefix)`) — formato `{prefix}-{Date.now()}-{random 0-999}`, es. `mus-1712834400000-427`
- **Sensitive data masking** (`backend/src/services/maskSensitive.js`, `sanitizeOutput()`) — chiavi mascherate (case-insensitive): `password`, `passwordhash`, `token`, `authorization`, `apikey`, `x-api-key` → sostituite con `'masked-data'`. Buffer → `{ type: 'buffer', length }`. Stream → `{ type: 'stream', info: 'streamed-response' }`. Ricorsivo su array/oggetti annidati.

### 6. Docker DEV

Due servizi in `backend/docker/docker-compose.yml` (Dockerfile: `node:20-alpine`, espone 3001 + 9229 debug):

- `artaround-app` — Node.js con `nodemon --legacy-watch`, volume mount del sorgente, `CHOKIDAR_USEPOLLING`/`WATCHPACK_POLLING` per hot-reload su Windows, debug port 9229
- `artaround-mongo` — MongoDB 7 con healthcheck (`mongosh ping`), volume persistente `mongo_data`

> Nota: le specifiche del docente richiedono il **deploy finale su due container Docker forniti dal dipartimento** (non quelli di sviluppo locale). Questo compose è solo per lo sviluppo locale/Docker DEV.

### 7. Frontend — stato attuale

Solo layer contrattuale, nessuna applicazione vera e propria:

- `frontend/index.ts` — interfacce TypeScript che specchiano il data model backend (Museum, BackendUser, Artwork, ArtworkItem, Visit, VisitStep, ActivityEntry, ecc.)
- `frontend/mockData.ts` — dataset mock **più ricco del seed reale**: 4 musei, 5 utenti, 7 opere, 12 item, 5 visite, 8 attività, più funzioni helper (`getMuseumById`, `getArtworksByMuseum`, `getItemsByArtwork`, ecc.). Utile come riferimento per popolare dati di test più realistici.

### 8. Frontend — pianificato (da specifiche docente)

#### ArtAround Navigator (smartphone)
Client-side JS/TS con framework (React/Vue/Angular/Svelte, scelta libera). Funzionalità richieste (livello base 18-24):
- Accesso al marketplace per selezionare museo/visita
- Selezione ed esecuzione di una visita
- Visualizzazione su mappa degli oggetti (no posizionamento utente nel livello base)
- Sintesi vocale + visualizzazione a schermo del contenuto dell'item selezionato
- Comandi vocali su vocabolario controllato (prossimo/precedente, "cos'è questo"/"dimmi di più"/"dimmi di meno", "non capisco"/"troppo semplice", chi è l'autore/stile, dov'è uscita/toilette/bar/shop/ostacoli)
- UI accessibile con bottoni equivalenti ai comandi vocali

#### ArtAround Marketplace/Editor (PC)
Client-side vanilla JS/TS (no framework SPA). Funzionalità richieste:
- Selezione museo da pannello di scelta multipla
- Visualizzazione contenuti esistenti (gratuiti e a pagamento) con gestione di scala (centinaia/migliaia di contenuti)
- Editing visita: aggiunta/riorganizzazione contenuti, contenuti multipli per stesso oggetto, contenuti opzionali
- Creazione contenuti: associazione a identificatore universale, immagine di riconoscimento, testi multipli, metadati
- Pubblicazione: licenza, prezzo, gestione adozioni/vendite

Entrambe le app **devono restare generiche** (non legate a un museo specifico): solo il Navigator può essere personalizzato per museo tramite file di configurazione (immagini, titoli); il Marketplace non ha versioni specifiche per museo.

## Flusso di una Richiesta Tipica (Backend)

```
Client -> [x-api-key + Bearer JWT]
  -> JSON Parser
  -> Request Logger (genera correlationId, inizia timer)
  -> API Key Auth (lookup hash SHA-256)
  -> JWT Auth (verifica firma, estrae userId + role)
  -> Route Handler (requireRole se necessario, Pagination/Tenant/IDGen)
  -> MongoDB query (con filtro tenant se curator)
  -> Response JSON
  -> Request Logger (salva log con timing + payload sanitizzati)
```

## API Endpoints

| Gruppo | Endpoint | Auth | Note |
|--------|----------|------|------|
| Health | `GET /health` | Nessuna | Liveness check |
| Auth | `POST /auth/login` | API Key | `{ username, password }` → JWT; aggiorna `lastLogin` |
| Museums | `GET/POST /museums`, `GET/PUT/DELETE /museums/:id` | API Key + JWT | CRUD, scoped per ruolo |
| Artworks | `GET/POST /artworks`, `GET/PUT/DELETE /artworks/:id` | API Key + JWT | CRUD, scoped via `museumId` |
| Items | `GET/POST /artwork-items`, `PUT/DELETE /artwork-items/:id` | API Key + JWT | Filtro `museumId` via lookup artworks per curator |
| Visits | `GET/POST /visits`, `GET/PUT/DELETE /visits/:id` | API Key + JWT | Percorsi guidati, scoped via `museumId` |
| Activities | `GET /activities`, `POST /activities` | API Key + JWT | **Solo lettura/creazione**: nessun GET/:id, PUT, DELETE |
| Users | `GET/POST /users`, `PATCH /users/:id` | API Key + JWT + super_admin (eccetto PATCH self per curator) | `passwordHash` mai esposto |
| API Keys | `GET/POST /api-keys`, `POST /api-keys/:prefix/disable` | API Key + JWT + super_admin | Chiave raw ritornata solo alla creazione |
| Logs | `GET /request-logs` | API Key + JWT + super_admin | Sola lettura |
| Docs | `GET /docs`, `GET /docs/openapi.json`, `GET /docs-json` | Basic Auth | Swagger UI + spec |

## Autenticazione

### Dual-layer Security

1. **API Key** (server-to-server): header `x-api-key`, hash SHA-256, gestione via CLI (`backend/src/scripts/apikey-cli.js`)
2. **JWT** (sessioni utente): header `Authorization: Bearer <token>`, scadenza configurabile (`JWT_EXPIRES_IN`, default `8h`), payload `{ sub: userId, role }`
3. **Basic Auth**: solo per `/docs*` (credenziali `SWAGGER_USER`/`SWAGGER_PASSWORD`)

### Flusso Login

```
POST /auth/login
  Headers: x-api-key: <key>
  Body: { username, password }
  -> requireApiKey
  -> Lookup User (status active) + bcryptjs.compare
  -> Aggiorna lastLogin
  -> jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn })
  -> Response: { token, tokenType: 'Bearer', expiresIn, user: { id, username, role, assignedMuseumIds } }
```

## Data Model - Relazioni

```
Museum 1──* Artwork 1──* ArtworkItem
Museum *──* User (assignedMuseumIds)
Museum 1──* Visit 1──* VisitStep ──> ArtworkItem (via itemId)
User 1──* Activity
```

**Corrispondenza con il modello "Visit + Item" delle specifiche del docente**: l'"Item" delle slide (testo per schermo/TTS, caratterizzato da lunghezza/registro linguistico/autore/licenza) corrisponde a `ArtworkItem`; l'oggetto fisico che l'item descrive è `Artwork`; la "Visit" delle slide (sequenza di item + indicazioni logistiche) corrisponde a `Visit` con i suoi `steps[]`. Le "indicazioni logistiche" tra un item e l'altro sono il campo `directionsFromPrevious` dello step. Vedi `knowledge-base.md` per l'analisi completa di questa corrispondenza e dei gap residui (es. gli item delle specifiche possono riferirsi anche a contenuti associati come stili/artisti/eventi storici, non solo a oggetti della visita — non ancora modellato).

## Configurazione (env)

Da `backend/src/config/env.js` + `backend/.env.example`. Tutte le variabili hanno un default, nessuna è strettamente obbligatoria per l'avvio:

| Variabile | Default | Uso |
|---|---|---|
| `PORT` | `3001` | Porta HTTP |
| `NODE_ENV` | `development` | Ambiente |
| `MONGO_URI` | `mongodb://artaround:artaround@localhost:27017/artaround?authSource=admin` | Connessione Mongo (`autoIndex: true`) |
| `JWT_SECRET` | `change-me-in-production` | Firma JWT |
| `JWT_EXPIRES_IN` | `8h` | Scadenza JWT |
| `SWAGGER_USER` | `swagger` | Basic Auth `/docs` |
| `SWAGGER_PASSWORD` | `swagger` | Basic Auth `/docs` |

## Testing

- Config: `backend/jest.config.js` — `testEnvironment: 'node'`, root `tests/`, setup `tests/testUtils/jest.setup.js` (forza `NODE_ENV=test`, timeout 30s), coverage da `src/**/*.js` (esclude `docs/openapi.js` e `scripts/**`)
- `backend/tests/unit/middleware/auth.test.js` — API key/JWT/ruoli (401/403 attesi)
- `backend/tests/unit/services/pagination.test.js` — alias di sort/search, combinazione filtri JSON + query
- `backend/tests/integration/smoke.integration.test.js` — health check, protezione Swagger, flusso login completo
- Infrastruttura (`backend/tests/testUtils/`): `mongoServer.js` (mongodb-memory-server, no Mongo reale richiesto), `appFactory.js` (`buildTestApp()`, purge cache moduli per isolamento), `authHelpers.js` (`createApiKey`, `createUser`), `dbHelpers.js` (`clearDatabase`, `disconnectDatabase`)
- Script npm: `npm test` (`jest --runInBand`), `npm run test:watch`, `npm run test:ci` (con coverage), `npm run test:unit`, `npm run test:integration`

## Script disponibili (`backend/package.json`)

| Script | Comando | Uso |
|---|---|---|
| `npm run dev` | `nodemon --legacy-watch server.js` | Sviluppo locale |
| `npm start` | `node server.js` | Avvio produzione |
| `npm run seed` | `node src/scripts/seed.js` | Popola DB (svuota tutte le collezioni e ricrea dati demo) |
| `npm run apikey` | `node src/scripts/apikey-cli.js` | CLI gestione API key: `generate --name=... --createdBy=...`, `disable --prefix=... --disabledBy=...`, `list` |
| `npm test` / `test:watch` / `test:ci` / `test:unit` / `test:integration` | vedi sopra | Test suite |

## Diagramma

Il diagramma architetturale completo è disponibile in [architecture.puml](architecture.puml) (componenti implementati e pianificati).
Renderizzabile con l'estensione PlantUML di VS Code o su [PlantUML Server](https://www.plantuml.com/plantuml).
