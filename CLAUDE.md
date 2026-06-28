# CLAUDE.md

Guida per Claude Code su questo repository. Per il contesto completo (specifiche del docente, criteri di valutazione, gap di progetto) vedi `docs/knowledge-base.md`; per il dettaglio tecnico del backend vedi `docs/ARCHITECTURE.md` e `docs/architecture.puml`.

## Cos'è questo progetto

ArtAround è un progetto del corso di Tecnologie Web (UniBO). Suite di app per visite museali personalizzate: **Navigator** (smartphone, durante la visita) e **Marketplace/Editor** (PC, prima della visita), appoggiate a un backend Node/Express/MongoDB comune. Il backend è avanzato; **nessuna delle due app frontend esiste ancora** (solo contratto di tipi in `frontend/index.ts` + mock in `frontend/mockData.ts`).

## Vincoli hard — non violare per nessun motivo

Sono requisiti del docente, non scelte di design discutibili. Violarli rende il progetto non accettabile:

- **Backend**: solo Node.js + Express + MongoDB + vanilla JS/TS. Mai PHP/Python/Java/Ruby/MySQL/Deno.
- **Navigator** (app smartphone, da creare): JS/TS **con framework** (React/Vue/Angular/Svelte).
- **Marketplace/Editor** (app PC, da creare): JS/TS **senza framework SPA** — solo vanilla JS/TS (ok Web Components, Alpine, HTMX).
- Deploy finale su **due container Docker del dipartimento** (codice + dati Mongo); le immagini Docker devono essere quelle fornite dal dipartimento, non immagini custom.
- Entrambe le app restano **generiche** (multi-museo); solo il Navigator si personalizza per museo via file di configurazione esterno (non va costruita una UI per crearlo).

## Layout del repository

```
backend/
  server.js              bootstrap, chiama buildApp() e avvia su env.port
  src/
    app.js                buildApp(): ordine middleware + mounting rotte
    config/                env.js (config con default), db.js (connectDb)
    middleware/             auth.js, requestLogger.js, errorHandler.js, asyncHandler.js, basicAuthDocs.js
    models/                 Museum, Artwork, ArtworkItem, Visit, User, Activity, ApiKey, RequestLog
    routes/                 un file per risorsa, sempre dietro requireApiKeyAndJwt
    services/               pagination.js, tenant.js, ids.js, maskSensitive.js
    scripts/                seed.js, apikey-cli.js
    docs/openapi.js         spec OpenAPI 3.0.3 statica
  tests/                  unit/ + integration/, mongodb-memory-server, vedi testUtils/
  docker/                 docker-compose.yml + Dockerfile (solo DEV locale)
frontend/
  index.ts               contratto di tipi TS che specchia i modelli Mongoose
  mockData.ts             dataset mock (più ricco del seed reale: 4 musei, 7 opere, 12 item, 5 visite)
docs/
  ARCHITECTURE.md          architettura tecnica dettagliata (backend + frontend pianificato)
  architecture.puml        diagramma (implementato vs pianificato)
  knowledge-base.md        specifiche del docente condensate, gap, requisiti di consegna
  claude-project-instructions.md   istruzioni per il Claude Project companion (claude.ai)
  25 Progetto 2526.pdf     slide originali del docente (fonte di verità per le specifiche)
  faqmd.md                 FAQ del docente
  ReadmeTemplate2526-18-33.txt   template del README.txt di consegna (diverso da README.md!)
```

## Convenzioni di codice da seguire

- **ID entità**: `generateEntityId(prefix)` in `backend/src/services/ids.js` → formato `{prefix}-{Date.now()}-{random 0-999}` (es. `mus-1712834400000-427`). Usa sempre questo helper, non generare ID a mano.
- **Risposte paginate**: ogni endpoint lista usa `paginateQuery()` (`backend/src/services/pagination.js`) e ritorna sempre `{ data, pagination, sort, filters }`. Non reinventare paginazione custom per nuovi endpoint.
- **Errori**: gli handler async vanno avvolti in `asyncHandler()`; gli errori arrivano a `errorHandler` che risponde `{ error: { message, status } }`. Non fare try/catch manuali nelle route per poi rispondere in formati diversi.
- **Multi-tenancy**: `canAccessMuseum(user, museumId)` e `scopedMuseumFilter(user)` in `backend/src/services/tenant.js` sono l'unico punto dove si decide se un `museum_curator` può vedere/modificare una risorsa. Riusali per ogni nuova rotta scoped a museo, non duplicare la logica `role === 'super_admin' ? ... : ...` altrove.
- **Auth**: `requireApiKeyAndJwt` è il middleware standard per le rotte protette; `requireRole('super_admin')` si applica in aggiunta dove serve. Le rotte `/auth/login` usano solo `requireApiKey` (niente JWT, è quello che lo emette).
- **Dati sensibili nei log**: `sanitizeOutput()` in `backend/src/services/maskSensitive.js` maschera automaticamente `password`/`token`/`authorization`/`apikey`/etc. Se aggiungi nuovi campi sensibili (es. futuri secret per provider LLM), aggiungili a `SENSITIVE_KEYS`.
- **Modelli Mongoose**: tutti usano `versionKey: false` e `timestamps: true`. Segui lo stesso pattern per nuovi modelli.

## Comandi utili

```bash
cd backend
npm install
npm run seed              # svuota e ripopola tutte le collezioni (dati demo, NON i requisiti di consegna)
npm run dev                # nodemon, hot reload
npm test                   # jest --runInBand (tutta la suite)
npm run test:unit          # solo tests/unit
npm run test:integration   # solo tests/integration
npm run apikey -- generate --name=dev-key --createdBy=usr-1
npm run apikey -- list

cd backend/docker
docker compose up --build  # API su :3001, Swagger su :3001/docs, Mongo su :27017
```

## Gap noti / prossimi passi (vedi `docs/knowledge-base.md` §5 per i dettagli)

1. **Creare le due app frontend** (Navigator framework-based, Marketplace vanilla JS) — al momento non esistono, solo i tipi.
2. **Espandere `seed.js`** per arrivare ai minimi di consegna: museo reale popolato, 3 visite ≥10 opere ciascuna sullo stesso museo, account `autore1`/`autore2`/`visitatore1`/`visitatore2` (password `12345678`). Il seed e il mock dataset attuali sono entrambi sotto questi minimi e con naming diverso.
3. **Modello ruoli marketplace**: `super_admin`/`museum_curator` non coprono i concetti di "autore" (crea contenuti) e "visitatore" (fruisce contenuti) richiesti dalle specifiche — da progettare prima di costruire login/onboarding del marketplace.
4. **`README.txt` di consegna**: file distinto da questo `README.md`, segue `docs/ReadmeTemplate2526-18-33.txt`. Va scritto solo al momento della sottomissione su Virtuale e dopo **non è più modificabile** — non toccarlo "di prova" prima del momento giusto.
5. Estensioni 18-27 (sync/insegnante) e 18-33 (geo/QR + LLM) non iniziate — vedi `docs/knowledge-base.md` per i requisiti esatti prima di cominciare.

## Promemoria criteri di valutazione

Il docente valuta generalità (poco hard-coded su un museo specifico), flessibilità/estendibilità del codice, usabilità per utenti che non conoscono il modello applicativo, e sofisticazione grafica. Tienili presenti scrivendo le due app frontend: sono il punto più visibile in fase di presentazione, più del backend.

## Lingua

Documentazione e commit in italiano (coerente con README.md, specifiche del corso, e l'utente). Codice e identificatori in inglese, come nel backend esistente.
