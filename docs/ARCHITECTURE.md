> Aggiornato il 2026-07-18: riallineato allo stato reale dopo che questo file era rimasto indietro rispetto a `docs/knowledge-base.md` (il paragrafo "Gap noti rimasti" del Navigator descriveva un problema già risolto). Aggiunta una sezione dedicata al Editor, prima assente qui pur essendo l'app già completa.

## Stato del progetto a colpo d'occhio

| Componente | Stato | Note |
|---|---|---|
| Backend API (Express + MongoDB) | ✅ Implementato | Auth, RBAC, multi-tenant, logging, paginazione, Swagger, test |
| ArtAround Navigator (app smartphone) | 🚧 Funzionante, in rifinitura | React + TanStack Router, SPA Vite (migrato da SSR). Flusso completo login→visite→player→mappa funzionante |
| ArtAround Editor (app PC) | ✅ Implementato | Vanilla JS + Tailwind CDN, proxy Node per CORS |
| Dati di seed conformi alla consegna | ✅ Completo | Seed Uffizi: 12 opere, item multi-registro, 3 visite, 5 utenti, idempotente per slug |
| Estensione 18-27 (visite sincronizzate) | ❌ Non in scope | Livello target: 18-24 |
| Estensione 18-33 (geolocalizzazione/QR + LLM) | ❌ Non in scope | Livello target: 18-24 |

## Mappa delle porte (sviluppo locale)

| Porta | Servizio | Note |
|---|---|---|
| 3002 | Backend Node.js | Porta 3001 evitata: occupata da Docker Desktop (`wslrelay.exe`/`com.docker.backend.exe` su Windows) |
| 5173 | Navigator (Vite dev server) | |
| 5174 | Editor (`serve.js`) | Spostato da 5173 per evitare conflitto col Navigator |

## Navigator — stato implementativo dettagliato

**Stack reale**: React 19 + TypeScript + TanStack Router + Tailwind, **Vite SPA standard** (non SSR). Il progetto era stato generato da Lovable con il template `tanstack_start_ts_current` (TanStack Start + Nitro, pensato per l'ambiente sandbox Lovable) ed è stato migrato a SPA pura perché il layer SSR non si inizializzava fuori da Lovable. File rimossi nella migrazione: `src/server.ts`, `src/start.ts`. File aggiunti: `index.html`, `src/main.tsx`.

**Schermate funzionanti**: `/login`, `/visits`, `/visit/:visitId`, `/player/:visitId/:stepIndex`, `/map/:visitId`.

**Risoluzione del museo — via slug, non ID statico**. Il seed non è più distruttivo: esegue upsert per `slug` stabile (`galleria-degli-uffizi`), quindi il `museumId` reale del DB resta costante tra esecuzioni di `npm run seed`. Il Navigator non usa più un `museumId` hardcoded in `museum.config.json`: usa `museumSlug`, e lo risolve dinamicamente all'avvio con `GET /museums?slug=...` in `AppContext.tsx`. Solo l'API key resta da rigenerare manualmente ad ogni seed (per design, è un segreto).

**Mappa multi-piano con pin**: `VisitStep` ha un campo opzionale `mapCoords: { x: number, y: number, floor: number }` (percentuali sull'immagine). Convenzione interna: `floor: 1` = sale 1-45 ("Secondo piano" Uffizi), `floor: 2` = sale 46-101 ("Primo piano" Uffizi) — numerazione non ovvia, derivata dal naming dei file mappa; è documentata con commento esplicito nel componente `map.$visitId.tsx` per evitare regressioni. Le immagini di sfondo vivono in `frontend/navigator/public/maps/` (`uffizi-p1.png`, `uffizi-p2.png`). Il componente mostra un selettore di piano (Primo piano / Secondo piano, in quest'ordine logico per l'utente) e pin posizionati con CSS assoluto; il click su un pin apre una card con titolo opera e bottone per saltare a quello step nel player.

**Registri linguistici nel player**: ogni step espone `itemsByRegister` (mappa registro→item); il player tiene un registro preferito di sessione (default: il più vicino a `medio`, a parità di distanza vince il più semplice) e i comandi "non capisco"/"troppo semplice" scendono/salgono al primo registro disponibile lungo la scala infantile→specialistico, aggiornando **insieme** schermo (`screenText`) e sintesi (`ttsText`). Bottoni e chip si disabilitano preventivamente quando nella direzione richiesta non c'è nessun registro; gli item già scaricati sono cache-ati per id (nessuna richiesta ripetuta cambiando registro avanti/indietro).

**Fix noti applicati durante lo sviluppo**:
- Bug 404 su `GET /artwork-items/:id`: l'endpoint non esiste nel backend; corretto a `GET /artwork-items?id=...` (singolo o batch con CSV di ID)
- Bug `currentItem.title`/`.artist`/`.register`: i campi reali sono annidati (`content.title`, `classification.languageRegister`); `artist`/`style` non esistono su `ArtworkItem` (sono su `Artwork`) — fallback "non disponibile" accettato per il livello 18-24
- Token JWT persistito in `localStorage`, con validazione all'avvio e logout automatico su 401

**Gap noti rimasti**: redesign UI completato il 2026-07-03 (token system "Galleria Bianca rivisitata", 5 schermate verificate a 390px — dettagli in `docs/knowledge-base.md` §5c). Resta un bug puntuale e circoscritto: overlap dei pin sulla mappa a 390px, perché `RADIUS = 2.5%` nell'offset circolare produce solo ~9px di separazione contro pin da 36px — le coordinate `mapCoords` sono corrette (misurate sulle planimetrie ufficiali Uffizi), va corretto solo il calcolo dell'offset in `map.$visitId.tsx`. Bottone "Apri Editor" con URL hardcoded (`http://localhost:5174`), da rendere configurabile in vista del deploy sui container del dipartimento.

## Editor — stato implementativo dettagliato

**Stack reale**: vanilla JS con ES Modules nativi, **nessun bundler/build step**, Tailwind via CDN. Routing basato su `location.hash` (SPA senza framework, come richiesto dal vincolo del docente). Struttura a tre livelli in `frontend/editor/`: `app.js` (bootstrap + router hash-based + guard di ruolo/museo), `components/` (libreria UI riusabile: `table.js`/`renderTable` per tabelle paginate con righe espandibili, `modal.js`/`buildForm` per form dichiarativi da array di campi, più `sidebar.js`, `topbar.js`, `toast.js`, `ui.js`), `pages/` (una coppia file HTML+JS per vista, caricata con `import()` dinamico all'interno del router).

**Dev server** (`serve.js`, zero dipendenze npm): due responsabilità — servire i file statici dell'app (con fallback su `index.html` per i deep-link via hash) e fare da **reverse proxy** verso il backend, iniettando lui l'header `x-api-key` letto da `serve.config.json` (non versionato). Così la api key non finisce mai nel bundle client-side, e il browser vede una sola origine.

**Pagine**: musei (lista a card + dettaglio/editing, creazione riservata a `super_admin`), contenuti (opere con item annidati in righe espandibili, regola di business "un'opera si pubblica solo se ha almeno un item"), **Visit Builder** (catalogo item a sinistra raggruppato per opera; una tappa = un'opera con uno slot per registro linguistico — `VisitStep.itemsByRegister`: il click su un item crea la tappa dell'opera o riempie/sostituisce lo slot del registro corrispondente sulla tappa esistente; con più candidati per la stessa coppia opera+registro si sceglie da un modal di preview in sola lettura (`components/itemPreview.js`, riusabile); chip dei registri coperti/mancanti su ogni tappa; sequenza step a destra con riordino manuale a frecce su/giù; salvataggio atomico dell'intero array `steps` in un'unica `PUT`, nessun autosave), utenti (solo `super_admin`, sospensione via `PATCH {status}` invece di cancellazione — non esiste `DELETE /users`).

**RBAC lato client**: le guardie nel router (`route.superAdmin`, `route.needsMuseum` in `app.js`) sono solo UX (redirect + toast se l'utente non ha i permessi) — la sicurezza reale resta interamente nel backend (JWT + ruolo + api-key iniettata dal proxy, mai esposta al client).

**43/43 check di integrazione passati** (vedi `frontend/editor/smoke-test.js`).

## Backend — fix rilevanti post go-live

- CORS abilitato (`app.use(cors())`) per consentire le chiamate dal Navigator/Editor in sviluppo locale (porte diverse = origin diverse)
- Seed reso idempotente: upsert per identificatori stabili (slug per i musei) invece di generazione random a ogni esecuzione, per non rompere i riferimenti salvati nelle config statiche del frontend

## Upload immagini (`/uploads`)

Aggiunto il 2026-07-19 per i form Artwork/ArtworkItem del Editor. `POST /uploads` (multipart, campo `file`, via `multer` in memoryStorage) accetta solo immagini (png/jpeg/webp/gif) fino a 5MB, richiede api-key + JWT + ruolo content editor, e risponde `{ id, filename, mimeType, size, url }` con `id` in formato `upl-...` (`generateEntityId`). Il binario è persistito **in MongoDB** (modello `Upload`, campo `Buffer` — scelta deliberata per il deploy sui due container del dipartimento: le immagini vivono nel container dati Mongo, quello persistito, e sopravvivono ai redeploy del container codice senza volumi aggiuntivi). `GET /uploads/:id` serve il binario ed è **pubblica** (niente header custom sui tag `<img>`). Il riferimento salvato nei record è l'`url` relativo (`/uploads/upl-...`): il Editor lo usa direttamente (stessa origine via proxy), il Navigator deve prefissarlo con il `baseUrl` di `api.config.json` quando lo renderizza.