# ArtAround — Knowledge Base del Progetto

> Riassunto delle specifiche del docente, stato di avanzamento e gap aperti.
> Per l'architettura tecnica (as-built) vedi `ARCHITECTURE.md`.
> Aggiornato il 2026-07-04: redesign UI Navigator completato e verificato (5 schermate, token system "Galleria Bianca rivisitata"). Bug aperto: overlap pin mappa a 390px.
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
| Item | `ArtworkItem` | `classification.fruitionLength`, `classification.languageRegister`, `license`, `creatorId` coprono lunghezza/registro/autore/licenza richiesti |
| Oggetto descritto dall'item | `Artwork` | Item e oggetto sono separati in due collezioni (`ArtworkItem.artworkId → Artwork.id`), coerente con "item multipli per lo stesso oggetto" |
| Visit | `Visit` | `steps[]` = sequenza di tappe + logistica |
| Item multipli per lo stesso oggetto nella visita | `VisitStep.itemsByRegister` | Mappa `{ registro → ArtworkItem.id }`, al massimo un item per registro per tappa (una tappa = un'opera); sostituisce il vecchio `itemId` singolo (2026-07-19). Il player Navigator cambia registro con "non capisco"/"troppo semplice" navigando la scala infantile→specialistico |
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
- **Seed conforme ai requisiti di consegna E idempotente** (`backend/src/scripts/seed.js`): museo reale Galleria degli Uffizi, 12 opere, 24 item (2 per opera: `elementare` 1min + `avanzato` 4min), 3 visite con 10-13 step ciascuna (tutte con `mapCoords` sugli step `main_item`), 5 utenti con credenziali corrette. Reso idempotente il 2026-06-30: il museo viene cercato per `slug: "galleria-degli-uffizi"` e riusato se esiste (upsert), così `npm run seed` può essere rieseguito quante volte serve senza generare un nuovo `museumId` casuale e senza duplicare entità a cascata (utenti, opere, item, visite).
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

**Schermate funzionanti**: `/login`, `/visits`, `/visit/:visitId`, `/player/:visitId/:stepIndex`, `/map/:visitId`.

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

**Rendering pin** (`map.$visitId.tsx`): un pin per `VisitStep`, separati da offset circolare calcolato dinamicamente lato frontend. Le coordinate nel seed restano identiche per sala; l'offset (`RADIUS = 2.5%`) è solo visivo. Algoritmo: step raggruppati per `(x, y, floor)`, poi `offset = RADIUS × cos/sin((2π/N) × idx)`. I pin sono figli di un `div.relative` che wrappa strettamente l'`<img>` della mappa — non del container `flex` esterno — così `top: y%` è calcolato rispetto all'altezza dell'immagine e non del viewport.

**Fix noti applicati durante lo sviluppo**:
- **404 su `GET /artwork-items/:id`**: l'endpoint singolo non esiste nel backend (solo `PUT`/`DELETE` per id). Corretto a `GET /artwork-items?id=...` (singolo nel player, batch con CSV di id nella schermata dettaglio visita, via `ListResponse<ArtworkItem>`).
- **Campi annidati letti male**: `currentItem.title` → `content.title` (con fallback `step.title`); `currentItem.register` → `classification.languageRegister`. `artist`/`style` non esistono su `ArtworkItem` (sono su `Artwork`) — fallback "non disponibile" accettato per il livello 18-24, nessuna fetch aggiuntiva.
- **Token JWT persistito in `localStorage`**, con validazione all'avvio (se il backend risponde 401, logout automatico) e gate di bootstrap che impedisce alle route di partire prima della verifica.
- **CommonJS vs ES Modules**: il backend usa `require` (CommonJS, scelta storica del progetto, non vincolo del docente); il Navigator usa `import` (ES Modules, naturale per React+Vite). I due coesistono senza conflitti — sono processi separati.

**Gap noti rimasti**:
- ~~UI/palette considerata sotto lo standard atteso dal docente~~ → **Redesign completato (2026-07-03)**: 5 schermate implementate sul token system "Galleria Bianca rivisitata" (§5c), verificate a 390px contro i mockup Claude Design con screenshot headless. Deviazioni accettate rispetto ai mockup (tutte per dati/logica mancanti, non per scelta di stile): niente login ospite/codice biglietto, niente bottom nav "Account", niente barra "in riproduzione" con tempi reali (limite Web Speech API — sostituita con chip Ascolta/Stop), niente attribuzione pittore su Player. Nota terminologica: l'`autore` richiesto dalla spec come metadato item è già coperto da `creatorId` su `ArtworkItem` — da non confondere con l'attribuzione del pittore (vive su `Artwork`, non su `ArtworkItem`; fallback "non disponibile" già accettato per 18-24).
- **Bug aperto — sovrapposizione pin mappa a 390px**: `RADIUS = 2.5%` nell'offset circolare produce solo ~9px di separazione contro pin da 36px, causando overlap nei cluster su mobile. Coordinate pin restano valide; da correggere solo il calcolo dell'offset.
- Bottone "Apri Editor" funzionante ma punta a un URL hardcoded (`http://localhost:5174`) — da rendere robusto/configurabile in vista del deploy sui container del dipartimento, dove le porte saranno diverse.

---

## 5c. Design token system — Navigator (finalizzato)

Direzione scelta: "Galleria Bianca rivisitata".
Palette: Fondo #FBFBF9, Superficie #FFFFFF, Pietra #ECEAE4,
Grafite #1A1A18, Muto #6E6E68, Vermiglio #D2452B (accento).
Tipografia: Figtree (display) + Instrument Sans (testo).
Elemento firma: indice numerico grande (tappa/sala reali).
Layout: mobile-first ~390px, testo-primo, controlli ≥44px.
Player: comandi vocali equivalenti in strip orizzontale scorrevole
con indicatore di posizione, invece di grid statica.

Implementazione: i token vivono in `services/navigator/app/src/styles.css` — palette brand come custom properties `--palette-*` (oklch, equivalenti esatti degli hex sopra) mappate sui token semantici shadcn/Tailwind (`--background`, `--primary`, ...). I componenti usano solo i token semantici: un tema alternativo (es. alto contrasto) si aggiunge ridefinendo le sole `--palette-*` in una classe tema, senza toccare i componenti.

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

- [x] Database già popolato al momento della presentazione, con un **museo reale** (Galleria degli Uffizi) e contenuti non superficiali (12 opere con immagine, 24 item, testi generati con LLM)
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

1. ~~**Redesign UI Navigator**~~ → completato (2026-07-03); resta solo il fix overlap pin mappa (§5b).
2. **Navigator: mostrare le immagini delle opere** — `Artwork.assets[]` è popolato e servito (§5d), ma nessuna schermata del Navigator lo consuma ancora. Serve prefissare l'URL relativo `/uploads/upl-…` col `baseUrl` di `api.config.json`.
3. **Immagine di copertina per le visite** — non implementata. Da valutare: nuovo campo `coverImage` su `Visit`, riuso dello stesso storage upload (§5d), esposizione nell'Editor (form informazioni generali visita, §5e) e nel Navigator (lista visite).
4. **Deploy sui container del dipartimento** — priorità attiva. Include: fix bottone "Apri Editor" (URL hardcoded `localhost:5174`); contattare i tecnici per le immagini Docker; adattare Navigator (build statica) e backend al setup reale.
5. **`README.txt` di consegna** — da scrivere al momento della sottomissione su Virtuale, seguendo `docs/ReadmeTemplate2526-18-33.txt`, non più modificabile dopo l'invio.