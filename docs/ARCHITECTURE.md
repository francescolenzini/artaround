## Stato del progetto a colpo d'occhio

| Componente | Stato | Note |
|---|---|---|
| Backend API (Express + MongoDB) | ✅ Implementato | Auth, RBAC, multi-tenant, logging, paginazione, Swagger, test |
| ArtAround Navigator (app smartphone) | 🚧 Funzionante, in rifinitura | React + TanStack Router, SPA Vite (migrato da SSR). Flusso completo login→visite→player→mappa funzionante |
| ArtAround Marketplace/Editor (app PC) | ✅ Implementato | Vanilla JS + Tailwind CDN, proxy Node per CORS |
| Dati di seed conformi alla consegna | ✅ Completo | Seed Uffizi: 12 opere, item multi-registro, 3 visite, 5 utenti, idempotente per slug |
| Estensione 18-27 (visite sincronizzate) | ❌ Non in scope | Livello target: 18-24 |
| Estensione 18-33 (geolocalizzazione/QR + LLM) | ❌ Non in scope | Livello target: 18-24 |

## Mappa delle porte (sviluppo locale)

| Porta | Servizio | Note |
|---|---|---|
| 3002 | Backend Node.js | Porta 3001 evitata: occupata da Docker Desktop (`wslrelay.exe`/`com.docker.backend.exe` su Windows) |
| 5173 | Navigator (Vite dev server) | |
| 5174 | Marketplace (`serve.js`) | Spostato da 5173 per evitare conflitto col Navigator |

## Navigator — stato implementativo dettagliato

**Stack reale**: React 19 + TypeScript + TanStack Router + Tailwind, **Vite SPA standard** (non SSR). Il progetto era stato generato da Lovable con il template `tanstack_start_ts_current` (TanStack Start + Nitro, pensato per l'ambiente sandbox Lovable) ed è stato migrato a SPA pura perché il layer SSR non si inizializzava fuori da Lovable. File rimossi nella migrazione: `src/server.ts`, `src/start.ts`. File aggiunti: `index.html`, `src/main.tsx`.

**Schermate funzionanti**: `/login`, `/visits`, `/visit/:visitId`, `/player/:visitId/:stepIndex`, `/map/:visitId`.

**Risoluzione del museo — via slug, non ID statico**. Il seed non è più distruttivo: esegue upsert per `slug` stabile (`galleria-degli-uffizi`), quindi il `museumId` reale del DB resta costante tra esecuzioni di `npm run seed`. Il Navigator non usa più un `museumId` hardcoded in `museum.config.json`: usa `museumSlug`, e lo risolve dinamicamente all'avvio con `GET /museums?slug=...` in `AppContext.tsx`. Solo l'API key resta da rigenerare manualmente ad ogni seed (per design, è un segreto).

**Mappa multi-piano con pin**: `VisitStep` ha un campo opzionale `mapCoords: { x: number, y: number, floor: number }` (percentuali sull'immagine). Convenzione interna: `floor: 1` = sale 1-45 ("Secondo piano" Uffizi), `floor: 2` = sale 46-101 ("Primo piano" Uffizi) — numerazione non ovvia, derivata dal naming dei file mappa; è documentata con commento esplicito nel componente `map.$visitId.tsx` per evitare regressioni. Le immagini di sfondo vivono in `frontend/navigator/public/maps/` (`uffizi-p1.png`, `uffizi-p2.png`). Il componente mostra un selettore di piano (Primo piano / Secondo piano, in quest'ordine logico per l'utente) e pin posizionati con CSS assoluto; il click su un pin apre una card con titolo opera e bottone per saltare a quello step nel player.

**Fix noti applicati durante lo sviluppo**:
- Bug 404 su `GET /artwork-items/:id`: l'endpoint non esiste nel backend; corretto a `GET /artwork-items?id=...` (singolo o batch con CSV di ID)
- Bug `currentItem.title`/`.artist`/`.register`: i campi reali sono annidati (`content.title`, `classification.languageRegister`); `artist`/`style` non esistono su `ArtworkItem` (sono su `Artwork`) — fallback "non disponibile" accettato per il livello 18-24
- Token JWT persistito in `localStorage`, con validazione all'avvio e logout automatico su 401

**Gap noti rimasti**: pin sulla mappa con coordinate stimate "a occhio", in fase di affinamento manuale; UI/palette considerata da migliorare (valutata su criteri di sofisticazione grafica, facilità d'uso, eleganza).

## Backend — fix rilevanti post go-live

- CORS abilitato (`app.use(cors())`) per consentire le chiamate dal Navigator/Marketplace in sviluppo locale (porte diverse = origin diverse)
- Seed reso idempotente: upsert per identificatori stabili (slug per i musei) invece di generazione random a ogni esecuzione, per non rompere i riferimenti salvati nelle config statiche del frontend