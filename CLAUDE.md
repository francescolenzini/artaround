# CLAUDE.md

Guida per Claude Code su questo repository. Per il contesto completo (specifiche del docente, criteri di valutazione, gap di progetto) vedi `docs/knowledge-base.md`; per il dettaglio tecnico del backend vedi `docs/ARCHITECTURE.md` e `docs/architecture.puml`.

## Cos'è questo progetto

ArtAround è un progetto del corso di Tecnologie Web (UniBO), livello **18-24, individuale**. Suite di tre applicazioni: backend Node/Express/MongoDB comune, **Navigator** (React, smartphone, durante la visita) e **Editor** (vanilla JS, PC, prima della visita). Tutte e tre sono **implementate e funzionanti end-to-end**: backend completo con test, Editor completo, Navigator completo (login → elenco visite → player con TTS/comandi vocali → mappa multi-piano → fine visita). Non fidarti della sola struttura di questo file per capire lo stato di avanzamento: verifica sempre `docs/knowledge-base.md` §5 (aggiornato più di frequente) e lo stato reale dei file, perché questa sezione può disallinearsi durante lo sviluppo.

## Vincoli hard — non violare per nessun motivo

Sono requisiti del docente, non scelte di design discutibili. Violarli rende il progetto non accettabile:

- **Backend**: solo Node.js + Express + MongoDB + vanilla JS/TS. Mai PHP/Python/Java/Ruby/MySQL/Deno.
- **Navigator** (app smartphone): JS/TS **con framework** — qui React 19 + TypeScript + TanStack Router (Vite SPA).
- **Editor** (app PC): JS/TS **senza framework SPA** — qui vanilla JS con ES Modules nativi, router basato su `location.hash`, Tailwind via CDN (nessun bundler/build step).
- Deploy finale su **due container Docker del dipartimento** (codice + dati Mongo); le immagini Docker devono essere quelle fornite dal dipartimento, non immagini custom. **Non ancora iniziato** — è il prossimo passo a priorità più alta.
- Entrambe le app restano **generiche** (multi-museo); solo il Navigator si personalizza per museo via due file di configurazione esterni in `frontend/navigator/public/` (`api.config.json`, `museum.config.json`) — non va costruita una UI per crearli, si dà per scontato che esistano già.

## Layout del repository

```
artaround/  →  REPO UMBRELLA: orchestra i 3 submodule e la build di produzione
  .gitmodules             definisce services/backend, services/navigator, services/editor
  app/                    assemblaggio di PRODUZIONE (esclusivo dell'umbrella, non nei submodule)
    server.js              Express: monta il backend, serve Navigator su / e Editor su /editor, inietta x-api-key lato server
    package.json          unica dipendenza: express
  docker/
    prod/app.Dockerfile   multi-stage: build Navigator + assembla backend + Editor in un unico container
    README.md             dettagli dell'immagine di produzione assemblata
  docker-compose.dev.yml  SVILUPPO: 4 servizi (mongo, backend, navigator, editor) che riusano i Dockerfile dei submodule
  docker-compose.prod.yml PRODUZIONE: 2 container (app assemblata + mongo)
  .env.dev.example / .env.prod.example

services/backend/  →  submodule (repo artaround-backend) — Node/Express/MongoDB
  app/
    server.js              bootstrap, chiama buildApp() e avvia su env.port
    src/
      app.js                buildApp(): ordine middleware + mounting rotte
      config/                env.js (config con default), db.js (connectDb)
      middleware/             auth.js, requestLogger.js, errorHandler.js, asyncHandler.js, basicAuthDocs.js
      models/                 Museum, Artwork, ArtworkItem, Visit, User, Activity, ApiKey, RequestLog, Upload
      routes/                 un file per risorsa, sempre dietro requireApiKeyAndJwt
      services/               pagination.js, tenant.js, ids.js, maskSensitive.js
      scripts/                seed.js, apikey-cli.js
      docs/openapi.js         spec OpenAPI 3.0.3 statica
    public/
  tests/                  unit/ + integration/, mongodb-memory-server (require → ../app/src/...)
  docker/                 Dockerfile (dev) + Dockerfile.prod + docker-compose*.yml
  package.json, jest.config.js, README.md

services/navigator/  →  submodule (repo artaround-navigator) — app smartphone, React 19 + TS + TanStack Router, Vite SPA
  app/
    src/main.tsx           entry point Vite
    src/router.tsx          createRouter() + QueryClient nel context tipato del router
    src/lib/AppContext.tsx  STATO GLOBALE: carica api.config.json/museum.config.json, auth (JWT in localStorage),
                            risolve museumSlug→museumId via GET /museums?slug=..., visita/item correnti
    src/lib/types.ts        contratto di tipi TS che specchia i modelli del backend (fonte di verità dei tipi lato client)
    src/routes/             file-based routing: __root.tsx (AppGate), login, visits, visit.$visitId,
                            player.$visitId.$stepIndex, map.$visitId, visit-complete.$visitId
    src/lib/speech.ts        wrapper su window.speechSynthesis / window.SpeechRecognition (nessuna libreria esterna)
    src/components/Shell.tsx  componenti presentazionali condivisi (ErrorScreen, LoadingScreen, Modal, Toast)
    public/api.config.json, public/museum.config.json   config esterna per museo (NON committare valori reali)
  docker/                 Dockerfile (dev) + Dockerfile.prod + nginx.conf + docker-entrypoint.d/
  README.md

services/editor/  →  submodule (repo artaround-editor) — app PC, vanilla JS, ES Modules, Tailwind CDN, router hash-based
  app/
    serve.js                dev server statico + reverse proxy verso il backend (inietta x-api-key, evita CORS)
    api.js                  client HTTP centralizzato (auth, gestione 401 uniforme, resource() factory REST)
    app.js                  router hash-based + guard RBAC lato client (solo UX, la sicurezza vera è nel backend)
    components/              sidebar, topbar, table (renderTable), modal (buildForm, confirmDialog), toast, ui (helper)
    pages/                   museums, museumDetail, content (opere+item), artworkDetail, visits, visitBuilder, users
    constants.js             enum condivisi con il backend + label italiane per la UI
    serve.config.json       config locale (apiKey/backendUrl/porta) — NON committare, vedi serve.config.example.json
  tests/smoke-test.js
  docker/                 Dockerfile (dev) + Dockerfile.prod + docker-compose*.yml
  README.md

docs/  (nell'umbrella)
  ARCHITECTURE.md          architettura tecnica dettagliata, aggiornata allo stato reale (backend+Navigator+Editor)
  architecture.puml        diagramma con legenda implementato/pianificato — NOTA: è più vecchio dei due .md sopra,
                            mostra ancora Navigator/Editor come "pianificati" mentre sono già implementati
  knowledge-base.md        specifiche del docente condensate, gap, requisiti di consegna
  claude-project-instructions.md   istruzioni per il Claude Project companion (claude.ai)
  25 Progetto 2526.pdf     slide originali del docente (fonte di verità per le specifiche)
  faqmd.md                 FAQ del docente
  ReadmeTemplate2526-18-33.txt   template del README.txt di consegna (diverso da README.md!)
```

**Ciclo di vita di un submodule**: modifica dentro `services/<nome>`, committa e fai push sul
repo del componente, poi nell'umbrella aggiorna il puntatore con `git add services/<nome>` +
commit. Dopo un clone: `git submodule update --init --recursive`. I file legacy condivisi
`frontend/index.ts`/`mockData.ts` non esistono più: il contratto di tipi vive in
`services/navigator/app/src/lib/types.ts`.

## Convenzioni di codice da seguire

- **ID entità**: `generateEntityId(prefix)` in `services/backend/app/src/services/ids.js` → formato `{prefix}-{Date.now()}-{random 0-999}` (es. `mus-1712834400000-427`). Usa sempre questo helper, non generare ID a mano.
- **Risposte paginate**: ogni endpoint lista usa `paginateQuery()` (`services/backend/app/src/services/pagination.js`) e ritorna sempre `{ data, pagination, sort, filters }`. Non reinventare paginazione custom per nuovi endpoint.
- **Errori**: gli handler async vanno avvolti in `asyncHandler()`; gli errori arrivano a `errorHandler` che risponde `{ error: { message, status } }`. Non fare try/catch manuali nelle route per poi rispondere in formati diversi.
- **Multi-tenancy**: `canAccessMuseum(user, museumId)` e `scopedMuseumFilter(user)` in `services/backend/app/src/services/tenant.js` sono l'unico punto dove si decide se un `author` può vedere/modificare una risorsa del suo museo. Riusali per ogni nuova rotta scoped a museo, non duplicare la logica `role === 'super_admin' ? ... : ...` altrove.
- **Auth**: `requireApiKeyAndJwt` è il middleware standard per le rotte protette; `requireRole('super_admin')` si applica in aggiunta dove serve. Le rotte `/auth/login` usano solo `requireApiKey` (niente JWT, è quello che lo emette).
- **Dati sensibili nei log**: `sanitizeOutput()` in `services/backend/app/src/services/maskSensitive.js` maschera automaticamente `password`/`token`/`authorization`/`apikey`/etc. Se aggiungi nuovi campi sensibili (es. futuri secret per provider LLM), aggiungili a `SENSITIVE_KEYS`.
- **Modelli Mongoose**: tutti usano `versionKey: false` e `timestamps: true`. Segui lo stesso pattern per nuovi modelli.
- **ID/riferimenti tra entità**: mai `ObjectId`/`populate`. Le relazioni (`museumId`, `artworkId`, `authorId`...) sono stringhe che puntano al campo `id` custom di un'altra collezione; risolvile con query manuali (`Model.find({...}).select('id')` poi `{$in: [...]}`), come già fanno tutte le route esistenti.
- **Navigator (React)**: stato globale e bootstrap (config esterna, auth, risoluzione museo) vivono **solo** in `AppContext.tsx` — non duplicare fetch di config/auth in una route. Le route sotto `src/routes/` sono file-based (TanStack Router); il player usa `content.screenText` per lo schermo e `content.ttsText` per la sintesi vocale, sono testi diversi, non riusare l'uno per l'altro. TTS/STT sono Web Speech API native (`src/lib/speech.ts`) — non aggiungere librerie esterne per quello che il browser già offre gratis. I comandi vocali sono un vocabolario controllato per matching di sottostringa (non NLP): ogni nuovo comando vocale va aggiunto sia all'handler sia come chip/bottone equivalente nella UI (parità comando vocale ↔ bottone è un requisito del docente, non opzionale).
- **Editor (vanilla JS)**: niente framework SPA, niente build step — riusa `buildForm()` (form dichiarativo da array di campi) e `renderTable()` (`components/modal.js`, `components/table.js`) invece di scrivere HTML a mano per nuove pagine CRUD. Le guardie di ruolo/museo nel router (`app.js`) sono solo UX: non fidarti di quelle per la sicurezza, la fonte di verità è sempre il backend. La API key non deve mai comparire nel codice client-side: la inietta `serve.js` lato proxy.

## Comandi utili

```bash
# Setup dopo il clone dell'umbrella
git submodule update --init --recursive   # popola services/backend|navigator|editor

# --- Stack completo via Docker (dalla radice dell'umbrella) ---
docker compose -f docker-compose.dev.yml up -d --build mongo backend
docker compose -f docker-compose.dev.yml run --rm backend npm run seed   # stampa la API key
API_KEY=<chiave> docker compose -f docker-compose.dev.yml up -d --build   # + navigator :5173, editor :5174
#   Backend/Swagger : http://localhost:3002/docs   Navigator : :5173   Editor : :5174

# --- Backend standalone (senza Docker) ---
cd services/backend
npm install
npm run seed               # idempotente (upsert su slug): Uffizi, utenti, opere, item, visite
npm run dev                # nodemon (app/server.js); su Windows usa PORT=3002 in .env
npm test                   # jest --runInBand (tutta la suite)
npm run test:unit          # solo tests/unit
npm run test:integration   # solo tests/integration
npm run apikey -- generate --name=dev-key --createdBy=usr-1

# --- Navigator standalone (richiede il backend attivo) ---
cd services/navigator/app
# crea public/api.config.json e public/museum.config.json (non versionati) con
# {apiKey, baseUrl} e {museumSlug: "galleria-degli-uffizi", ...} — apiKey stampata da `npm run seed`
npm install
npm run dev                # Vite dev server, http://localhost:5173

# --- Editor standalone (richiede il backend attivo) ---
cd services/editor/app
# copia serve.config.example.json → serve.config.json e incolla apiKey/backendUrl reali
node serve.js              # http://localhost:5174
```

## Igiene git (committare spesso, senza rischi)

Storicamente il working tree accumula sessioni intere di lavoro prima di un commit: evitalo.

- **Attiva l'hook** (una volta per clone): `git config core.hooksPath .githooks`. Il pre-commit
  in `.githooks/pre-commit` blocca solo il committare per sbaglio segreti/staging (`.env`,
  `serve.config.json`, `api.config.json`, `museum.json`, `steps.json`, `docs/_design_pdf_pages/`),
  **non** gira i test — così committare resta veloce e frequente.
- **Convenzione**: al termine di ogni blocco di lavoro coerente, proponi/fai un commit tematico
  (un commit = un cambiamento logico), invece di lasciar crescere il tree. Non accorpare in un
  unico commit modifiche di ambiti scollegati (es. backend ruoli + design PDF).

## Gap noti / prossimi passi (vedi `docs/knowledge-base.md` §5-§6 per i dettagli aggiornati)

Backend, Editor e Navigator sono completi e funzionanti. Quello che resta:

1. **Deploy sui due container Docker del dipartimento** — priorità più alta, non ancora iniziato. Include: contattare i tecnici per le immagini fornite (una Node/Express, una Mongo — mai immagini custom), adattare il Navigator a una build statica servita da Nginx (non serve un processo Node SSR a runtime), e rendere configurabile l'URL del Editor nel bottone "Apri Editor" del Navigator (oggi hardcoded a `localhost:5174`, non valido fuori dev locale).
2. **Bug noto**: overlap dei pin sulla mappa multi-piano del Navigator a 390px (`map.$visitId.tsx`) — il raggio dell'offset circolare (`RADIUS = 2.5%`) è troppo piccolo rispetto alla dimensione reale dei pin; le coordinate restano valide, va corretto solo il calcolo dell'offset.
3. **`README.txt` di consegna**: file distinto da questo `README.md`, segue `docs/ReadmeTemplate2526-18-33.txt`. Va scritto solo al momento della sottomissione su Virtuale e dopo **non è più modificabile** — non toccarlo "di prova" prima del momento giusto.
4. Gap di modello dichiarato non bloccante per 18-24: gli "item su contenuti associati" (stili, artisti, eventi storici non legati a un oggetto fisico specifico) non sono modellati — solo `Artwork` (oggetti fisici) ha `ArtworkItem` associati.
5. Estensioni 18-27 (sync/insegnante) e 18-33 (geo/QR + LLM) **non in scope** per questo progetto (target dichiarato: 18-24) — vedi `docs/knowledge-base.md` §4 per i requisiti esatti se lo scope dovesse cambiare.

## Promemoria criteri di valutazione

Il docente valuta generalità (poco hard-coded su un museo specifico), flessibilità/estendibilità del codice, usabilità per utenti che non conoscono il modello applicativo, e sofisticazione grafica. Le due app frontend sono il punto più visibile in fase di presentazione, più del backend: qualunque modifica lì va valutata anche con questi criteri in mente, non solo per correttezza funzionale.

## Lingua

Documentazione e commit in italiano (coerente con README.md, specifiche del corso, e l'utente). Codice e identificatori in inglese, come nel backend esistente.
