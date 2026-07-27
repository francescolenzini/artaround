# ArtAround — Knowledge Base del Progetto

> Riassunto delle specifiche del docente, stato di avanzamento e gap aperti.
> Per l'architettura tecnica (as-built) vedi `ARCHITECTURE.md`.
> Aggiornato il 2026-07-26: separati i **due assi di adattamento dell'item** — registro linguistico e durata (§5g). `VisitStep.itemsByRegister` → `itemIds`; "dimmi di più" e "troppo semplice" non sono più sinonimi. Seed portato a 56 item con griglia registro × durata sulle opere vetrina.
> Aggiornato il 2026-07-25: implementato l'handoff "Galleria Bianca" (§5f) — sistema di navigazione contestuale, microfono come gesto primario, mappa come overlay globale. Chiuso il bug di overlap dei pin mappa.
> Aggiornato il 2026-07-18: riallineati `CLAUDE.md`, `docs/ARCHITECTURE.md` e `docs/architecture.puml` allo stato reale — erano rimasti disallineati a livelli diversi (`CLAUDE.md` dichiarava ancora i due frontend "da creare"; `ARCHITECTURE.md` descriveva nel Navigator un gap già chiuso dal redesign UI del 2026-07-03; `architecture.puml` mostrava Navigator e Editor come "pianificati"). Nessun cambiamento funzionale al codice, solo documentazione. Questo file (`knowledge-base.md`) era già quello aggiornato correttamente ed è stato usato come riferimento per correggere gli altri tre.
> Aggiornato il 2026-07-19: upload immagini implementato da zero (storage MongoDB, non filesystem — vedi §5d); form Editor corretti su una serie di problemi di usabilità (§5e); seed popolato con 12 immagini reali di pubblico dominio per le opere. Gap aperto emerso e annotato: nessun gating di acquisto reale dietro `isFree`/`price` (§2). Prossimi passi aggiornati (§10): Navigator non mostra ancora le immagini caricate, e le visite non hanno immagine di copertina.

---

## 1. Cos'è ArtAround

ArtAround è una suite generica di applicazioni per la visita personalizzata a musei, gallerie d'arte ed esposizioni, sviluppata per il corso di Tecnologie Web (UniBO, A.A. 2025/26). Durante la visita l'utente usa lo smartphone per muoversi negli spazi espositivi e ascolta in auricolari spiegazioni testuali degli oggetti esposti — sempre in presenza fisica, mai da remoto.

Due tipi di servizio:
- **Prima della visita** (Editor + Editor): preparare contenuti, venderli, trovarne, selezionare una sequenza per una visita specifica.
- **Durante la visita** (Navigator): essere guidati da un oggetto all'altro, ascoltare descrizioni di linguaggio variabile, fare domande sull'oggetto e argomenti correlati.

**Criterio di successo UX**: capacità del Navigator di parlare a tutti gli utenti secondo le loro esigenze e competenze individuali.
**Criterio di successo di mercato**: la stessa applicazione deve adattarsi a musei diversi cambiando solo immagini e file di configurazione.

---

## 2. Modello di dominio richiesto: Visit + Item

Le specifiche del docente fissano un modello a due strutture dati, **prima** di qualunque scelta implementativa:

- **Visit** = sequenza di descrizioni di Item **+** indicazioni logistiche generali (es. *"l'entrata è da via Garibaldi 2, biglietto 15€, guardaroba gratuito"*) **+** indicazioni di spostamento tra un item e l'altro (es. *"proseguire a sinistra della scala verso la sala 12"*). Le indicazioni logistiche **non sono item** e non ne fanno parte.
- **Item** = testo pensato sia per la visualizzazione a schermo sia per la sintesi vocale, eventualmente con immagine di riconoscimento. Caratterizzato **almeno** da: **lunghezza** (es. 3s/15s/1min/4min), **linguaggio/registro** (es. infantile/elementare/medio/specialistico), **autore**, **licenza**. Una visita *dovrebbe* avere **item multipli per lo stesso oggetto** (varianti di lunghezza/registro). Gli item possono descrivere non solo gli oggetti della visita ma anche **contenuti associati** (movimenti culturali, stili, artisti, eventi storici).

### Corrispondenza con il modello implementato nel backend

| Concetto spec | Implementazione | Note |
|---|---|---|
| Item | `ArtworkItem` | `classification.fruitionLength`, `classification.languageRegister`, `license`, `creatorId` coprono lunghezza/registro/autore/licenza richiesti. **Lunghezza e registro sono due assi indipendenti** e dal 2026-07-26 lo sono anche a runtime, non solo come metadati editoriali (§5g) |
| Oggetto descritto dall'item | `Artwork` | Item e oggetto sono separati in due collezioni (`ArtworkItem.artworkId → Artwork.id`), coerente con "item multipli per lo stesso oggetto" |
| Visit | `Visit` | `steps[]` = sequenza di tappe + logistica |
| Item multipli per lo stesso oggetto nella visita | `VisitStep.itemIds` | Lista piatta delle varianti disponibili per la tappa (una tappa = un'opera). Registro e durata di ciascuna si leggono da `ArtworkItem.classification`, quindi non sono duplicati nello step e non possono divergere. Sostituisce `itemsByRegister` (2026-07-26), che essendo una mappa a chiavi fisse ammetteva **un solo item per registro** e rendeva la lunghezza inutilizzabile come dimensione di scelta. Vedi §5g |
| Indicazioni logistiche tra item | `VisitStep.directionsFromPrevious` | Step di tipo `transition`/`logistics_intro` per le indicazioni non legate a un item specifico |
| Posizione fisica dell'item nella visita | `VisitStep.mapCoords` | `{ x, y, floor }` — percentuali sull'immagine della mappa di piano (aggiunto 2026-06-30) |
| Item su contenuti associati (stili, artisti, eventi) | **Non modellato** | `Artwork` rappresenta solo oggetti fisici del museo; non c'è un'entità per "contenuto associato" non legato a un oggetto specifico — **gap aperto, non bloccante per 18-24** |
| Pubblicazione: licenza/prezzo/adozioni/vendite | **Parzialmente modellato** | `isFree`/`price`/`license` esistono come metadati editoriali su `ArtworkItem`, ma non c'è alcun gating applicativo: le route backend li usano solo per ordinamento/filtro, non per limitare l'accesso al contenuto. Qualunque visitatore autenticato legge integralmente anche i contenuti "a pagamento" — **gap aperto, non bloccante per 18-24** (prezzo/licenza restano validi come dato editoriale in vetrina) |

In sintesi: il cuore del modello dati è coerente con le specifiche. Il gap sui "contenuti associati liberi" non è bloccante per il livello 18-24.

---

## 3. Vincoli tecnologici hard (non negoziabili)

Dalle slide "Vincoli hard" — violarli rischia la non accettabilità del progetto:

- **Backend**: Node.js + MongoDB + Express + vanilla JavaScript o TypeScript, moduli npm liberi. **Vietati**: PHP, Perl, Python, Java, Ruby, MySQL e qualunque tecnologia server-side fuori dall'ecosistema Node. **Vietato anche Deno.**
- **ArtAround Navigator**: client-side JS/TS, **con un framework a scelta** tra Angular, React, Vue, Svelte (o equivalenti).
- **ArtAround Editor**: client-side JS/TS, **senza framework SPA** — vanilla JS, ok Web Components, Alpine o HTMX.
- **Grafica**: libreria libera (Bootstrap, Tailwind, Foundation, ecc.) ma si valuta esplicitamente sofisticazione grafica, facilità d'uso ed eleganza.
- **Deploy obbligatorio** su **due container Docker** delle macchine del dipartimento — nessuna eccezione. Tutto il codice e tutti i dati risiedono lì. La scelta delle API (terze parti, LLM, mappe, ecc.) è libera.
- **Entrambe le app sono generiche**, non legate a un museo specifico:
  - Il **Navigator** può essere personalizzato per un singolo museo tramite **file di configurazione** (immagini, titoli) — non va costruita un'interfaccia per crearlo, si dà per scontato che esista già (JSON generico per il caso multi-museo, più strutturato per il caso mono-museo).
  - Il **Editor non ha versioni specifiche per museo**.

Questi vincoli sono scritti **in verde** nelle slide originali (vincoli specifici per le esigenze del progetto universitario, non necessariamente opportuni in un prodotto di mercato reale).

---

## 4. Livelli di progetto: 18-24 / 18-27 / 18-33

Il voto del progetto va da 18 a 24/27/33 in trentesimi (poi mediato 50/50 con lo scritto). Il gruppo sceglie il livello a cui puntare.

**Livello scelto per questo progetto: 18-24, lavoro individuale.**

### Base (18-24) — tutto ciò che è "nero" nelle slide, sempre obbligatorio

Struttura base del Navigator:
- Accesso all'editor
- Selezione ed esecuzione di una visita
- Visualizzazione su mappa degli oggetti (**senza** posizionamento dell'utente)
- Sintesi vocale + visualizzazione a schermo del contenuto dell'item selezionato
- **Comandi vocali su vocabolario controllato**: prossimo/precedente; "cos'è questo"/"dimmi di più"/"dimmi di meno"; "non capisco"/"troppo semplice"; chi è l'autore/qual è lo stile; dov'è uscita/toilette/bar/shop/ostacoli; ecc.
- **UI accessibile a bottoni**, equivalente ai comandi vocali (per chi non usa la voce)

Editor base: selezione museo da pannello, visualizzazione contenuti esistenti (gratuiti/a pagamento) con gestione della scala, editing visita, creazione contenuti (id universale, immagine, testi multipli, metadati), pubblicazione (licenza, prezzo, adozioni, vendite).

**Vincoli**: 18-24 è individuale o gruppi di 2 persone.

### Estensione 18-27 — "arancione", visite sincronizzate (insegnante/guida)

Non in scope per questo progetto. Pensata per una docente che trasmette contenuti sincronizzati a tutti gli studenti contemporaneamente e ne controlla l'attenzione (nome mnemonico della visita, controllo avanzamento centralizzato, quiz finale). **Vincoli**: gruppi di 1-2-3 persone.

### Estensione 18-33 — "arancione", geolocalizzazione + LLM generativa

Non in scope per questo progetto. Prevede QR code o geolocalizzazione per la localizzazione, e integrazione LLM per 4 scopi precisi: creazione item mancanti, comandi vocali in linguaggio naturale libero (l'LLM fa da router verso il vocabolario controllato, non risponde liberamente), traduzione in tempo reale, generazione di visite su misura. Vincolo esplicito: l'utente non deve mai accorgersi di interagire con un LLM. **Requisiti di consegna**: QR code stampabili + modulo di "teletrasporto" per demo. **Vincoli**: gruppi di 2-3 persone, presentazione di persona su appuntamento.

---

## 5. Stato di avanzamento del repository e gap aperti

> Aggiornato il 2026-06-30 dopo la sessione di completamento Navigator (migrazione SPA, fix 404 artwork-items, mappa multi-piano, seed idempotente via slug). Va riconfermato a ogni ripresa del lavoro.

### Cosa esiste ed è solido

- **Backend** Express/Mongoose completo: 6 entità di dominio + 2 infrastrutturali, auth dual-layer (API key + JWT), RBAC a tre ruoli `super_admin`/`author`/`visitor` (il `visitor` è di sola lettura — le scritture su musei/opere/item/visite passano dalla guardia unica `requireContentEditor` in `backend/src/middleware/auth.js`), multi-tenancy single-DB, paginazione server-side centralizzata, logging richieste con masking, Swagger protetto da Basic Auth, suite di test (unit + integration) con mongodb-memory-server, script seed e CLI api-key.
- **Seed conforme ai requisiti di consegna E idempotente** (`backend/src/scripts/seed.js`): museo reale Galleria degli Uffizi, 12 opere, **56 item** su griglia registro × durata (§5g: 2 per le opere minori, 8-10 per Venere/Primavera/Medusa/Giuditta), 3 visite con 10-13 step ciascuna (tutte con `mapCoords` sugli step `main_item`), 5 utenti con credenziali corrette. Reso idempotente il 2026-06-30: il museo viene cercato per `slug: "galleria-degli-uffizi"` e riusato se esiste (upsert), così `npm run seed` può essere rieseguito quante volte serve senza generare un nuovo `museumId` casuale e senza duplicare entità a cascata (utenti, opere, item, visite).
- **Bug requestLogger fixato** (`backend/src/middleware/requestLogger.js`): `sanitizeOutput()` ora è avvolta in `safeSanitize()` con try/catch — un errore di logging non propaga più HTTP 500 sulle scritture.
- **CORS abilitato** (`app.use(cors())` in `backend/src/app.js`) per consentire le chiamate dal Navigator/Editor in sviluppo locale (porte diverse = origin diverse per il browser).
- **Editor completato** (`services/editor/app/`, vanilla JS + HTML + Tailwind CDN, zero framework SPA): dev server proxy Node (`serve.js`) su porta **5174**, client HTTP (`api.js`), router hash-based, CRUD completo su musei/opere/item/visite/utenti, visit builder a due colonne, guard per ruolo e museo. 43/43 check di integrazione passati.
- **Navigator completato e funzionante end-to-end** (`services/navigator/app/`): vedi dettaglio sezione 5b.

### Mappa delle porte (sviluppo locale)

| Porta | Servizio | Note |
|---|---|---|
| **3002** | Backend Node.js | Porta 3001 evitata: occupata da Docker Desktop (`wslrelay.exe`/`com.docker.backend.exe` su Windows) |
| **5173** | Navigator (Vite dev server) | |
| **5174** | Editor (`serve.js`) | Spostato da 5173 per evitare conflitto col Navigator |

### Credenziali seed (tutte con password `12345678`)

| username | ruolo | accesso |
|---|---|---|
| `admin` | `super_admin` | Editor completo (musei, utenti, tutti i contenuti) |
| `autore1` | `author` | Editor: solo Uffizi, no /users, lettura+scrittura contenuti |
| `autore2` | `author` | Editor: solo Uffizi, no /users, lettura+scrittura contenuti |
| `visitatore1` | `visitor` | Solo Navigator (sola lettura via API); login all'Editor bloccato |
| `visitatore2` | `visitor` | Solo Navigator (sola lettura via API); login all'Editor bloccato |

Email: `<username>@artaround.it`.

### Note operative importanti

- **API key**: il seed la rigenera casuale a ogni `npm run seed` (per design — è un segreto, non va resa stabile). Il valore va copiato dall'output del seed e incollato sia in `services/editor/app/serve.config.json` (campo `apiKey`) sia in `services/navigator/app/public/api.config.json` (campo `apiKey`). La CLI `node src/scripts/apikey-cli.js list` mostra il prefix ma non il valore completo — per ottenere un nuovo valore usa `node src/scripts/apikey-cli.js generate --name=<nome> --createdBy=system`.
- **`museumId` non va più gestito a mano**: dal fix di idempotenza del 2026-06-30, il Navigator risolve il museo dinamicamente tramite `museumSlug` (`"galleria-degli-uffizi"`) in `museum.config.json`, chiamando `GET /museums?slug=...` all'avvio. Non serve più aggiornare un `museumId` statico dopo ogni seed.
- **Avvio Editor in sviluppo**: `node services/editor/app/serve.js` → apre su `http://localhost:5174`. Richiede il backend attivo su `:3002`.
- **Avvio Navigator in sviluppo**: `bun run dev` (o `npm run dev`) in `services/navigator/app/` → apre su `http://localhost:5173`. Richiede `public/api.config.json` creato a mano (non è in git) con `apiKey` e `baseUrl: "http://localhost:3002"`.
- **Mockup Lovable** (`https://lovable.dev/projects/4b4b4697-98de-4764-920d-dfd0770bf734`): riferimento visivo usato inizialmente per il Navigator; il progetto reale è stato generato da Lovable con template SSR e poi migrato a SPA (vedi sezione 5b).
- **Convenzione PowerShell per test API manuali**: usare `Invoke-RestMethod` invece di `curl` (l'alias `curl` di PowerShell non gestisce bene sintassi unix-style con `-H`/`-d` multi-riga); per i token JWT salvare sempre in variabile (`$token = $response.token`) invece di copiare dal terminale, che tronca l'output lungo nella visualizzazione a tabella.

---

## 5b. Navigator — stato implementativo dettagliato

**Stack reale**: React 19 + TypeScript + TanStack Router + Tailwind, **Vite SPA standard**.

**Storia della migrazione SPA**: il progetto era stato generato da Lovable con il template `tanstack_start_ts_current` (TanStack Start + Nitro, SSR pensato per l'ambiente sandbox Lovable). Fuori da Lovable il dev server crashava al boot perché il wrapper `@lovable.dev/vite-tanstack-config` non si inizializzava. Migrato a SPA pura il 2026-06-29: rimosso il layer SSR/Nitro, creato un entry point Vite standard. File rimossi: `src/server.ts`, `src/start.ts`. File aggiunti: `index.html`, `src/main.tsx`. Deploy finale: build statica (`dist/`) servita da Nginx o equivalente — non serve un processo Node SSR a runtime.

**Schermate funzionanti**: `/login`, `/visits`, `/visit/:visitId`, `/player/:visitId/:stepIndex`, `/map/:visitId`, `/map` (pianta del museo senza visita attiva), `/visit-complete/:visitId`.

**Risoluzione del museo — via slug, non ID statico**. `museum.config.json` usa `museumSlug` (non più `museumId`). Il Navigator risolve lo slug nell'ID reale del museo all'avvio chiamando `GET /museums?slug=...` in `AppContext.tsx`, prima di esporre il museo al resto dell'app (gate di bootstrap in `__root.tsx`). Questo rende il Navigator indipendente dall'ID fisico nel database, coerente col criterio di valutazione "generalità".

**Mappa multi-piano con pin** (`map.$visitId.tsx`): `VisitStep` ha un campo opzionale `mapCoords: { x: number, y: number, floor: number }` (percentuali sull'immagine, 0-100). Convenzione interna: `floor: 1` = sale 1-45 ("Secondo piano" Uffizi nell'etichetta UI), `floor: 2` = sale 46-101 ("Primo piano" Uffizi) — numerazione non ovvia, nata da un disallineamento fra il criterio usato per i dati del seed e il naming dei file immagine (`uffizi-p1.png`/`uffizi-p2.png`); è documentata con commento esplicito nel codice per evitare regressioni. Le immagini di sfondo vivono in `services/navigator/app/public/maps/` (`uffizi-p1.png` = piano con sale 46-101, `uffizi-p2.png` = piano con sale 1-45 — i nomi file NON corrispondono numericamente al `floor` che mostrano, per via della stessa origine storica). Il componente mostra un selettore con due bottoni in ordine "Primo piano" / "Secondo piano" (ordine logico per l'utente, disaccoppiato dal valore grezzo di `floor` tramite una tabella esplicita `FLOORS` nel componente) e pin posizionati con CSS assoluto (`left: x%`, `top: y%`); il click su un pin apre una card con titolo opera e bottone per saltare a quello step nel player.

**Coordinate mapCoords per sala** (misurate con click diretto sulle planimetrie ufficiali Uffizi gennaio 2026; più opere nella stessa sala condividono le stesse coordinate nel seed):

| Sala | floor | x% | y% | Opere |
|---|---|---|---|---|
| A9  | 1 | 43.9 | 23.2 | La Primavera, La nascita di Venere (Botticelli) |
| A35 | 1 | 70.1 | 66.2 | Annunciazione, Adorazione dei Magi (Leonardo) |
| A38 | 1 | 56.9 | 66.2 | Tondo Doni, Madonna del Cardellino, Leone X (Michelangelo/Raffaello) |
| D23 | 2 | 83.5 | 82.7 | Flora, Venere di Urbino (Tiziano) |
| E4  | 2 | 73.6 | 19.2 | Medusa, Sacrificio di Isacco, Giuditta e Oloferne (Caravaggio/Artemisia) |

**Rendering pin** (`components/MapView.tsx`, condiviso da `/map/:visitId` e `/map`): un pin per `VisitStep`, separati da offset circolare calcolato dinamicamente lato frontend. Le coordinate nel seed restano identiche per sala; l'offset è solo visivo. Algoritmo: step raggruppati per `(x, y, floor)`, poi `offset = raggio × cos/sin((2π/N) × idx)`. **Il raggio è in pixel, non in percentuale** (`max(22, 18N/π)`) e viene applicato dentro la `transform` del pin: in percentuale dipendeva dalla larghezza della mappa e restava più piccolo del pin stesso — è la correzione del bug di overlap a 390px. I pin sono figli di un `div.relative` che wrappa strettamente l'`<img>` della mappa — non del container `flex` esterno — così `top: y%` è calcolato rispetto all'altezza dell'immagine e non del viewport.

**Fix noti applicati durante lo sviluppo**:
- **404 su `GET /artwork-items/:id`**: l'endpoint singolo non esiste nel backend (solo `PUT`/`DELETE` per id). Corretto a `GET /artwork-items?id=...` (singolo nel player, batch con CSV di id nella schermata dettaglio visita, via `ListResponse<ArtworkItem>`).
- **Campi annidati letti male**: `currentItem.title` → `content.title` (con fallback `step.title`); `currentItem.register` → `classification.languageRegister`. `artist`/`style` non esistono su `ArtworkItem` (sono su `Artwork`) — fallback "non disponibile" accettato per il livello 18-24, nessuna fetch aggiuntiva.
- **Token JWT persistito in `localStorage`**, con validazione all'avvio (se il backend risponde 401, logout automatico) e gate di bootstrap che impedisce alle route di partire prima della verifica.
- **CommonJS vs ES Modules**: il backend usa `require` (CommonJS, scelta storica del progetto, non vincolo del docente); il Navigator usa `import` (ES Modules, naturale per React+Vite). I due coesistono senza conflitti — sono processi separati.

**Gap noti rimasti**:
- ~~UI/palette considerata sotto lo standard atteso dal docente~~ → **Redesign completato (2026-07-03)**: 5 schermate implementate sul token system "Galleria Bianca rivisitata" (§5c), verificate a 390px contro i mockup Claude Design con screenshot headless. Deviazioni accettate rispetto ai mockup (tutte per dati/logica mancanti, non per scelta di stile): niente login ospite/codice biglietto, niente bottom nav "Account", niente barra "in riproduzione" con tempi reali (limite Web Speech API — sostituita con chip Ascolta/Stop), niente attribuzione pittore su Player. Nota terminologica: l'`autore` richiesto dalla spec come metadato item è già coperto da `creatorId` su `ArtworkItem` — da non confondere con l'attribuzione del pittore (vive su `Artwork`, non su `ArtworkItem`; fallback "non disponibile" già accettato per 18-24).
- ~~**Bug — sovrapposizione pin mappa a 390px**~~ → **corretto il 2026-07-25**: l'offset circolare è passato da percentuale a pixel dentro la `transform` (vedi "Rendering pin" sopra). Le coordinate del seed non sono state toccate.
- Link "Apri Editor" (ora nel menu account, §5f): l'URL arriva da `marketplaceUrl` in `museum.config.json`, quindi è già configurabile per museo; è il **file di esempio locale** a puntare a `http://localhost:5174`. In fase di deploy sui container del dipartimento va scritto l'URL reale in quel file, non nel codice.

---

## 5c. Design token system — Navigator (finalizzato)

Direzione scelta: "Galleria Bianca rivisitata".
Palette: Fondo #FBFBF9, Superficie #FFFFFF, Pietra #ECEAE4,
Grafite #1A1A18, Muto #6E6E68, Vermiglio #D2452B (accento).
Tipografia: Figtree (display) + Instrument Sans (testo).
Elemento firma: indice numerico grande (tappa/sala reali).
Layout: mobile-first ~390px, testo-primo, controlli ≥44px.
Player: comandi vocali secondari in una tendina richiudibile sopra la riga
di navigazione (§5f), invece di un carosello sempre visibile.

Implementazione: i token vivono in `services/navigator/app/src/styles.css` — palette brand come custom properties `--palette-*` (oklch, equivalenti esatti degli hex sopra) mappate sui token semantici shadcn/Tailwind (`--background`, `--primary`, ...). I componenti usano solo i token semantici: un tema alternativo (es. alto contrasto) si aggiunge ridefinendo le sole `--palette-*` in una classe tema, senza toccare i componenti.

Neutri di supporto aggiunti con l'handoff (§5f), stessa logica: `--palette-whisper` #F7F5F0 (superficie tenue della barra player), `--palette-line` #E2E0D9 (bordo dei controlli, distinto dal riempimento "pietra" che coincide con `--border`), `--palette-faint` #9A9A92 (terzo livello di testo) → token semantici `--surface-muted`, `--line`, `--foreground-subtle` → utility `bg-surface-muted`, `border-line`, `text-foreground-subtle`.

Velo e ombre degli overlay (aggiunti col redesign della tendina, §5f), derivati dalla grafite con `color-mix` invece di essere `rgba` hard-coded nei componenti: `--scrim` (grafite 32%) → `bg-scrim`, `--shadow-tint`/`--shadow-tint-strong` → `--shadow-sheet` (ombra verso l'alto, tendina dei comandi) e `--shadow-popover` (verso il basso, popover account e Modal) → utility `shadow-sheet`, `shadow-popover`. Il velo sta al 32% e non più basso perché sotto il ~25% risulta più chiaro della pietra dei controlli e non si legge come velo. Anche questi seguono da soli un tema alternativo, perché puntano a `--palette-graphite`.

---

## 5f. Navigator — sistema di navigazione "Galleria Bianca" (2026-07-25)

Secondo livello dell'handoff di design (progetto Claude Design `80c56614-7914-4349-a42f-680a9f9154d6`, file `ArtAround Navigator - Handoff.dc.html` + `design_handoff_schermate/README.md`, letti via DesignSync). Il primo livello — i token di §5c — era già applicato; questo round riguarda navigazione e gerarchia delle schermate.

**Tre regole al posto di una tab bar** (`components/Nav.tsx`):
1. **Indietro sempre in alto a sinistra**, senza contenitore, con etichetta che nomina la destinazione (`BackLink`). È l'unico significante di "indietro" dell'app.
2. **Mappa come overlay globale** (`MapPill`): pill flottante in basso a destra fuori dalla visita, pill nera nell'header dentro il player (dove una flottante coprirebbe i comandi). La chiusura usa `history.back()` e l'etichetta arriva dal search param `from` (`lib/mapSearch.ts`): `from=player&step=N` → "Torna a Tappa 0N".
3. **Account = iniziali nell'header** con popover (`AccountMenu`): nome, badge ruolo, "Apri Editor ↗", "Esci". Nessuna route, nessuno stato globale nuovo. Etichette ruolo: `super_admin` → Admin, `author` → Autore (stessa parola dell'Editor, per non avere due nomi dello stesso ruolo nella suite), `visitor` → Visitatore.

**Player** (`player.$visitId.$stepIndex.tsx`): shell ad altezza fissa (`h-[100dvh]`, scroll confinato al `<main>`) così microfono e comandi non finiscono mai sotto la piega. Il **microfono è il gesto primario**: cerchio da 68px fra Precedente e Prossimo, unico elemento pieno d'accento della schermata. In ascolto il racconto va in **pausa** (non stop) e riprende da solo se il comando non ha toccato l'audio; la barra player diventa grafite con "Sto ascoltando…", i comandi diventano una griglia di quelli davvero disponibili per la tappa, e un box mostra l'ultimo comando riconosciuto con il suo effetto.

**Nuovo comando vocale**: "troppo complicato" (→ registro più semplice), presente sia nell'handler sia come chip, come richiede la parità comando vocale ↔ bottone. *(Aggiornato 2026-07-26, §5g: i chip sono ora quattro, uno per direzione di ciascun asse — "troppo complicato" resta come sinonimo vocale di "non capisco", non come sesto chip.)*

**Tendina dei comandi secondari** (`components/CommandSheet.tsx`, 2026-07-26): i 6 comandi vocali/chip e il pannello "Info del museo" sono raccolti in un pannello richiudibile che emerge da dietro una maniglia etichettata ("Comandi e info del museo") appena sopra la riga Precedente/Microfono/Prossimo, invece di restare sempre espansi in un carosello a due alla volta *(dal 2026-07-26 sono quattro comandi di variante più autore/stile, raggruppati per asse in tre sezioni etichettate — §5g)*. Motivazione: il footer eccedeva lo spazio disponibile e tagliava silenziosamente contenuto (scroll nascosto), comprimendo il testo dell'opera che il design system dichiara protagonista. Deroga controllata a "Comandi sempre visibili e ampi · nessun menu nascosto" (`ArtAround Design System.pdf`, banda 3): restano sempre visibili i comandi **primari** (Ascolta/Pausa, Stop, Precedente, Microfono, Prossimo); solo i **secondari** (registro, autore/stile, logistica) finiscono nella tendina, dietro una maniglia etichettata a parole (non un glifo muto) — non è un menu nascosto, è una sezione dichiarata e richiudibile. La parità comando vocale ↔ bottone non è intaccata: `handleVoice` non dipende dalla visibilità dei chip. Comportamento: apre/chiude con tap o swipe sulla maniglia, con scrim e `Escape`; si chiude automaticamente quando si apre il microfono; un comando vocale **non riconosciuto** apre la tendina oltre al Toast (mostra il vocabolario nel momento in cui serve); i chip di registro eseguono e chiudono (l'esito va mostrato a schermo), i chip autore/stile/logistica eseguono e restano aperti (aprono un Modal, si può fare un'altra domanda). Stato persistito per sessione (`sessionStorage`, chiave `artaround.player.commandsOpen`), default chiuso.

**Resa della tendina** (redesign 2026-07-26, secondo giro): il pannello è una fascia **a filo dei bordi della shell** con bordo superiore **squadrato**, staccata dal contenuto solo da un filo `border-line` e dall'ombra `shadow-sheet`. Un raggio lasciava due angoli trasparenti affacciati sul velo, che si leggevano come un difetto di rendering; il padding orizzontale è passato dal `<footer>` ai suoi figli, così la fascia non rientra più di 20px per lato. Il `<footer>` è `bg-card` e il suo filo superiore diventa trasparente a tendina aperta (colore condizionale, non presenza, per non spostare tutto di 1px): pannello → maniglia → riga di navigazione devono leggersi come **una sola superficie continua**, e senza fondo opaco il velo traspariva da sotto il footer. Il velo è `absolute inset-0` **dentro la shell** `max-w-md` (già `overflow-hidden`) e non `fixed` sul viewport — su schermi larghi oscurava anche le bande fuori dalla colonna del telefono, ed era questo a farlo sembrare artificiale; `CommandSheet` lo monta lì con un portale (prop `scrimContainer`) per tenere dentro un solo componente tutta la logica di chiusura. Stesso velo (`bg-scrim` + `backdrop-blur-[3px]`) per popover account e Modal: aperto dalla tendina il Modal ci si sovrappone, e i due veli sommandosi danno la profondità dove il nero pieno di prima faceva uno stacco brusco a metà del gesto.

**Comandi non disponibili**: distinti per **superficie** e non sbiadendo l'etichetta — disponibile = pieno `bg-secondary` con testo grafite semibold, non disponibile = solo contorno (`bg-card` + `border-line`) con testo `text-muted-foreground` (5.2:1, AA). L'etichetta resta pienamente leggibile perché insegnare il vocabolario vocale è metà del senso della tendina, anche quando il comando ora non si applica. Soprattutto: non sono più `disabled` ma `aria-disabled`, e **restano tappabili**. `disabled` bloccava `onClick` e con esso il Toast esplicativo che `goToRegister`/`showAuthor`/`showStyle` emettono già da soli ("Non c'è una versione più semplice per questa tappa"), rendendolo raggiungibile **solo parlando**: una rottura della parità comando vocale ↔ bottone, dato che `handleVoice` non ha mai consultato lo stato del bottone. Al tocco di un comando non disponibile la tendina **resta aperta**, così il Toast si legge nel suo contesto. È la stessa logica delle pill logistica, già sempre tappabili anche quando il museo non ha quell'informazione.

**Sessione**: `AppContext` ora persiste anche l'utente (`artaround_user` in `localStorage`), altrimenti nome e ruolo sparivano dal popover al primo reload pur restando valida la sessione. Il backend è stato esteso di conseguenza: `POST /auth/login` restituisce anche `fullName` (modifica additiva in `authRoutes.js`).

**Scelte consapevoli diverse dai mockup**:
- **Riga sala ("SALE 10–14")**: omessa. Non esiste un campo sala nel modello — `VisitStep` ha solo `mapCoords.floor`. Implementabile in futuro aggiungendo `room?: string` a `VisitStep` nel backend, il campo corrispondente nel `visitBuilder` dell'Editor e il valore nel seed; finché quel dato non c'è, inventarlo lato client sarebbe hard-coding su un museo specifico.
- **Timer audio ("02:14 / 03:40")**: non implementato. `speechSynthesis` non espone né durata né posizione dell'utterance: la barra mostra l'equalizzatore e lo stato, senza numeri inventati.
- **Caret "▾" accanto al nome del museo**: rimosso. Suggerirebbe un selettore di museo che non esiste (il Navigator è mono-museo per configurazione).
- **"Apri Editor" nel popover account**: i mockup mostrano solo "Esci", ma il link esisteva già nell'header della home e toglierlo avrebbe eliminato una funzionalità.
- **Card visita**: lasciate come erano, su richiesta esplicita (i mockup proponevano thumbnail 62px e meta "N opere · M min").

---

## 5g. Due assi di adattamento: registro × durata (2026-07-26)

**Il problema.** Nel player `"Dimmi di più"` e `"Troppo semplice"` facevano **la stessa identica cosa**, e così `"Dimmi di meno"` / `"Troppo complicato"`: sei chip per quattro azioni, di cui solo due distinte. Non era un difetto della UI ma del modello dati. `VisitStep.itemsByRegister` era una mappa a cinque chiavi fisse `registro → un solo item`: esisteva **una sola scala navigabile**, e i due comandi non avevano altro posto dove andare.

Le slide del docente sono esplicite sul punto: un item è caratterizzato "almeno" da **lunghezza** (3s/15s/1min/4min) **e** da **linguaggio** (infantile/elementare/medio/specialistico), e le quattro slide-esempio "ArtAround : Item" sono letteralmente una **matrice tono × durata** sulla stessa opera. Il vocabolario dei comandi tiene le due coppie separate, e l'estensione 18-33 parla di creare item "di livello **o** linguaggio non disponibili" — di nuovo due cose.

`classification.fruitionLength` esisteva già nel modello, l'Editor lo raccoglieva, e **nessuno lo usava per scegliere un contenuto**. Il seed rendeva la cosa invisibile perché lunghezza e registro erano correlati 1:1 (`elementare`=1min, `avanzato`=4min): erano la stessa variabile travestita da due.

**La soluzione.**

- `VisitStep.itemsByRegister` → `VisitStep.itemIds`, lista piatta. Registro e durata di ogni variante si leggono dall'item, non dalla chiave dello step: un dato solo, in un posto solo.
- L'**asse registro** resta la scala ordinale fissa dell'enum. L'**asse durata** non ha scala predefinita: i gradini sono i minuti che l'autore ha davvero caricato per quella tappa. Nessuna soglia "breve/medio/lungo" hard-coded — una tappa con 1/2/4 min ha tre gradini, una con 1 e 4 ne ha due.
- Tutta la selezione vive in `services/navigator/app/src/lib/itemVariants.ts` (modulo puro, 25 test in `itemVariants.test.ts`): `buildGrid`, `resolveVariant`, `neighbour`. Il player si limita a chiedere "spostati di uno su questo asse".

**I due assi non sono simmetrici, ed è deliberato:**

- Sul **registro** il gradino va sempre onorato — è "chi sono io". Se il registro di destinazione non ha la durata corrente si prende la sua più vicina: meglio un racconto un po' più lungo del previsto che un rifiuto.
- Sulla **durata** si resta dentro lo stesso registro. Rispondere a "dimmi di più" con un testo specialistico sarebbe esattamente la confusione fra i due assi che la feature esiste per togliere: se non c'è una versione più lunga in quel registro, la risposta corretta è "non c'è". Il Toast lo dice nominando l'asse e suggerendo l'altro comando (*"In registro Avanzato non c'è una versione più lunga — prova «troppo semplice»"*), perché è il momento in cui l'utente sta imparando che gli assi sono due.

**Riscontro a schermo.** Sotto il titolo dell'opera una riga sempre visibile mostra la posizione sui due assi (`Racconto: Medio · Durata: ≈2 min · 10 versioni disponibili`), con le stesse due etichette dei gruppi di comandi nella tendina. Senza, i due comandi cambierebbero entrambi il testo e resterebbe all'utente indovinare cosa sia successo. La preferenza `{registro, durata}` è persistita in `sessionStorage` (prima il registro si perdeva a ogni reload).

**Griglia irregolare per scelta.** Regola editoriale del seed sulle 4 opere vetrina: elementare e medio coprono 1/2/4 min, avanzato 2/4 min, infantile solo 1min e specialistico solo 4min — nessun autore scrive una scheda specialistica lampo né un racconto per bambini di quattro minuti. Le altre 8 opere restano a due varianti. Il ripiego alla cella più vicina è quindi il caso **normale**, non la gestione di un errore. Seed: **56 item** (erano 37).

**Editor.** Il visit builder mostra la stessa griglia che il player naviga: una riga per registro, un chip per durata, in grigio i registri con una sola durata (lì "dimmi di più" non avrà risposta). Cade il vincolo "un item per registro": l'unico conflitto reale è la cella già occupata — stesso registro **e** stessa durata — e lì `chooseItemWithPreview` fa scegliere quale versione tenere, che è il suo nuovo scopo.

**Modifiche collaterali, fatte perché la feature le rendeva rilevanti:**

- `GET /artwork-items` ora forza `status: 'published'` per il ruolo `visitor`, come già fa `/visits`. Prima il player chiedeva un id alla volta, già scelto dall'autore; ora carica in blocco tutte le varianti della tappa, quindi una bozza potrebbe arrivare al visitatore. `status` è anche fra gli `ignoreFilterFields` per quel ruolo, altrimenti un `?status=draft` esplicito scavalcherebbe il `baseFilter` (paginateQuery applica i query param **dopo**).
- Il catalogo del visit builder scorre le pagine invece di chiedere `pageSize: 200`: il backend taglia a 100 senza segnalarlo, e con 56 item il margine si era dimezzato.
- `services/backend/app/src/scripts/migrate-visit-items.js` (`npm run migrate:visit-items`), one-shot e idempotente, converte le visite scritte a mano che un re-seed non ricrea.

---

## 5d. Upload immagini — storage e utilizzo

**Storage: MongoDB, non filesystem.** Scelta guidata dal vincolo Docker non negoziabile (§3): il filesystem del container codice non è garantito persistere ai redeploy senza un volume dedicato, non ancora verificato con i tecnici del dipartimento; MongoDB è invece il container dati persistito. Binario salvato come `Buffer` in una collezione dedicata `Upload` (id `upl-…`, filename, mimeType, size, uploaderId), ben sotto il limite BSON di 16MB/documento (cap applicativo a 5MB).

**Endpoint**: `POST /uploads` (multipart, campo `file`, multer memoryStorage, solo png/jpeg/webp/gif, 413 oltre 5MB, dietro api-key + JWT + `requireContentEditor`) risponde `{id, filename, mimeType, size, url}`. `GET /uploads/:id` serve il binario ed è **pubblica senza auth** — scelta deliberata: le immagini nel modello sono solo "di riconoscimento" (spec, §1), il contenuto testuale/vendibile vive in `ArtworkItem.content` (title/rendering/screenText/ttsText), mai in `images[]`. Nessun paywall applicativo esiste comunque dietro `isFree`/`price` (§2), quindi l'endpoint pubblico non è un anello debole di un meccanismo che non c'è.

**Utilizzo nel modello dati**: il riferimento salvato è l'URL relativo `/uploads/upl-…`.
- `Artwork.assets[]` — popolato nel seed per le 12 opere (§5) con riproduzioni di pubblico dominio da Wikimedia Commons, upsert condizionale (si aggiunge solo se l'opera non ha già un asset `image`, così il re-seed non sovrascrive immagini caricate dopo dall'Editor).
- `ArtworkItem.images[]` — campo esistente nel modello, **non popolato** (scelta deliberata: gli item sono varianti di registro dello stesso oggetto, l'immagine di riconoscimento vive a livello `Artwork` per evitare duplicazione; per mostrarla a livello item si risale via `artworkId`).
- Cover immagine delle **visite** — non ancora implementata, vedi §10.

**Gap aperto**: il **Navigator non mostra ancora le immagini delle opere** — il campo `Artwork.assets[]` è popolato e servito, ma nessuna schermata del Navigator lo consuma ancora. Vedi §10.

---

## 5e. Editor — form Artwork/ArtworkItem, fix di usabilità (2026-07-19)

Sessione di correzioni sul componente condiviso `buildForm` (`components/modal.js`), usato sia dal form Artwork che ArtworkItem:

- **Durata fruizione**: input numerico in minuti (era tendina).
- **Durata lettura stimata** (ex "Durata target"): campo sola-lettura, calcolato dal conteggio parole del "Testo a schermo" (~150-160 wpm italiano), ricalcolato on-the-fly a ogni modifica del testo. Non più editabile a mano.
- **Lingue e valute**: liste espanse (erano troppo corte).
- **Prezzo**: step numerico sensato, corretto un bug che permetteva un valore "0." non valido.
- **Gratuito / Supporta TTS / Supporta schermo**: i checkbox ora nascondono/mostrano del tutto i campi dipendenti (Prezzo+Valuta; campi TTS; Testo a schermo) invece di limitarsi a disabilitarli.
- **Layout ArtworkItem**: Prezzo e Valuta allineati orizzontalmente sotto "Gratuito".
- **Stile/Categoria**: label tradotte in italiano nel form Artwork, valore interno persistito invariato (nessuna migrazione dati).
- **WYSIWYG**: editor leggero (nessun bundler nell'Editor, integrazione via CDN/contenteditable) su descrizione Artwork, "Testo a schermo" ArtworkItem, descrizione Museo, descrizione Visita. Il campo TTS dell'item resta testo semplice, non toccato dalla migrazione.
- **Visit Builder**: sezione "Informazioni generali della visita" editabile sopra il layout a due colonne; rimosso il checkmark dal bottone "Salva visita"; aggiunta ricerca/filtro nel catalogo item; rimossa la label ridondante "Già assegnato a una tappa" (resta solo il checkmark); tipo tappa non più modificabile dopo la creazione (rimossa la tendina sullo step già in sequenza).
- **Upload immagini**: campo "Immagine" nei form Artwork/ArtworkItem passato da URL a upload file con anteprima — vedi §5d per lo storage.

---

Dalla sezione "Requisiti di progetto" e "La consegna" delle slide:

- [x] Database già popolato al momento della presentazione, con un **museo reale** (Galleria degli Uffizi) e contenuti non superficiali (12 opere con immagine, 56 item su griglia registro × durata, testi generati con LLM)
- [x] Account editor: `autore1`, `autore2`, `visitatore1`, `visitatore2` — password `12345678` per tutti; `admin` con stessa password
- [x] Almeno **3 visite** sullo stesso museo, **≥10 opere ciascuna**, differenziate per contenuti/livello di conoscenza
- [x] Navigator funzionante end-to-end (login, selezione visita, player con TTS e comandi vocali/bottoni, mappa multi-piano)
- [ ] (Se 18-27) — non in scope per questo progetto
- [ ] (Se 18-33) — non in scope per questo progetto
- [ ] Deploy su **due container Docker del dipartimento** (codice + dati) — **non ancora iniziato**, contattare i tecnici con anticipo
- [ ] Directory `sources` con **tutti** i sorgenti leggibili (permessi 755 per directory/eseguibili, 644 per file), **senza** `node_modules`
- [ ] File `README.txt` (non `.md`) dal template fornito, completo di: nome gruppo, membri (nome/cognome/matricola/email), tipo progetto e locazione file/docker, organizzazione sorgenti, tecnologie usate per ciascuna applicazione (server-side, editor, navigator), contributo individuale dettagliato, contributo della LLM se usata
- [ ] `README.txt` sottomesso su Virtuale **prima** della data di valutazione e mai più modificato dopo

### Vincoli su gruppo e contributo individuale

- Gruppi di **2-3 persone** (18-24 anche individuale o 2 persone); nessun gruppo oltre 3 persone per nessun motivo. **Questo progetto: individuale.**
- Ogni membro deve dimostrare un contributo **determinante**, su client **e** server: solo HTML/CSS non basta, così come solo parti marginali (login/logout/lettura preferenze). La distribuzione ideale dei compiti è **funzionale**, non architetturale (cioè non "uno fa tutto il backend, uno tutto il frontend").
- Il progetto si presenta **tutto il gruppo insieme**, in presenza o su MS Teams — mai a pezzi in date diverse.

---

## 7. Criteri di valutazione del docente

1. **Generalità dei tool** — quanto le soluzioni per la compatibilità multi-museo sono forzate vs frutto di scelte ottimali di framework/organizzazione/uso delle tecnologie.
2. **Flessibilità** — quanto le soluzioni tecniche sono solide, strutturate, comprensibili, estendibili, adattabili a nuovi device/browser/OS/modelli di dati/annotazione.
3. **Usabilità** — attenzione alle esigenze di utenti che non conoscono i dettagli del modello applicativo (eventi, attività proprie e altrui).
4. **Sofisticazione grafica** — rapporto dimensioni-maschera/dimensioni-dati, label comprensibili vs dati formalizzati, differenziazione visiva tra tipi di dato/annotazione.

Più: fino a 2 punti aggiuntivi a discrezione del docente per scelte creative e funzionali.

---

## 8. FAQ rilevanti del docente (da `docs/faqmd.md`)

- **Privacy/cookie**: non si applicano (progetto non pubblicato).
- **Comandi vocali "aperti"**: il sistema gestisce un **numero limitato** di domande predefinite; l'LLM fa da **router** che mappa la domanda libera dell'utente alla domanda predefinita più simile (non passa la domanda "as-is" a un LLM generico). L'elenco di domande accettabili può crescere in base al wording reale usato dagli utenti.
- **Precisione delle indicazioni** ("dov'è il bagno?"): **KISS** — bastano indicazioni assolute e indipendenti dalla posizione (es. "in fondo al corridoio A"), niente motore di pathfinding.
- **Docker**: vanno usate **solo** le immagini fornite dai tecnici del dipartimento (una con Node/Express, una con Mongo); non si possono proporre immagini custom. Le dipendenze necessarie si installano dentro quelle immagini.
- **Precisione sui tempi**: KISS, bastano indicazioni di massima.
- **Da dove iniziare**: il docente consiglia di partire dal **editor**, con un'interfaccia e-commerce classica a tabella, poi migliorare iterativamente.
- **Geolocalizzazione**: non serve precisione al centimetro — la precisione GPS civile (≤5m) basta per indicare gli oggetti vicini; l'**orientamento** del device è invece abbastanza affidabile e utile (es. "l'utente sta andando verso est").
- **File di configurazione**: esistono due livelli — uno generico riusabile per qualunque museo, uno specifico e strutturato per un singolo museo (immagine di copertina, contenuti, cartina...). **Non va costruita un'interfaccia per crearlo**: si dà per scontato che esista già (es. scritto a mano o generato offline).
- **Costo chiamate LLM**: cercare opzioni economiche/gratuite (es. risorse tipo `free-llm-api-resources` su GitHub).

---

## 9. Scadenze rilevanti A.A. 2025/26

- Appelli scritto: 16 gen 2026 (regole anni passati), 28 gen 2026, 12 feb 2026 (da confermare), 28 mag 2026, 23 giu 2026, 13 lug 2026, 16 set 2026. Posti limitati (45) per appello, prenotazione necessaria.
- **Deadline progetto: 31 luglio 2026.**

---

## 10. Prossimi passi (in ordine di priorità)

1. ~~**Redesign UI Navigator**~~ → completato: token (2026-07-03, §5c) e sistema di navigazione dell'handoff (2026-07-25, §5f). Chiuso anche il fix overlap pin mappa.
2. ~~**Navigator: immagini delle opere e copertine visita**~~ → fatto: la lista visite usa `Visit.coverImage` e il player la miniatura da `Artwork.assets[]`, entrambe risolte con `toAbsoluteUrl(baseUrl, …)`.
3. **Deploy sui container del dipartimento** — priorità attiva. Include: scrivere il `marketplaceUrl` reale in `museum.config.json` (§5b); contattare i tecnici per le immagini Docker; adattare Navigator (build statica) e backend al setup reale.
4. **Campo sala su `VisitStep`** (opzionale, migliora l'orientamento in sala) — `room?: string` nel modello backend + campo nel `visitBuilder` dell'Editor + valore nel seed; solo dopo si può mostrare la riga sala prevista dai mockup nel player e nella card mappa (§5f).
5. **`README.txt` di consegna** — da scrivere al momento della sottomissione su Virtuale, seguendo `docs/ReadmeTemplate2526-18-33.txt`, non più modificabile dopo l'invio.