# Insegnamento di Tecnologie Web
# CdS in Informatica - A.A. 2025-26

# Progetto ArtAround 18-24

# READ ME DEL PROGETTO ARTAROUND

## Nome del gruppo:

ArtAround

## Membri del gruppo

* Nome e cognome: `Francesco Lenzini`, matricola: `000119401`, mail: `francesco.lenzini2@studio.unibo.it`
* LLM (strumenti usati, non membri del gruppo): `Claude (Anthropic, servizio proprietario soggetto ai termini Anthropic); OpenAI Codex (GPT-5), servizio proprietario soggetto ai termini OpenAI`

Il progetto è individuale. Francesco Lenzini è il punto di contatto primario.

## Tipo progetto

18-24

## Data di disponibilità delle applicazioni

29 luglio 2026

## Locazione del progetto:

* URI dell'editor: `https://site252622.tw.cs.unibo.it/editor`
* URI del navigator: `https://site252622.tw.cs.unibo.it/`
* Altri URI rilevanti: `https://site252622.tw.cs.unibo.it/health` e `https://site252622.tw.cs.unibo.it/docs` (Swagger, protetto da Basic Auth)

## Organizzazione dei sorgenti

La root pubblicata è `/home/web/site252622/html/`. Il runtime contiene
`server.js`, `backend/` (API Node/Express), `frontends/navigator/` (build
statica React) e `frontends/editor/` (asset Vanilla JS). L'applicazione usa il
secondo container MongoDB del dipartimento, accessibile solo dalla rete interna.

La directory leggibile `/home/web/site252622/html/source/` non contiene
`node_modules` ed è organizzata in:

* `source/server-side/main/`: composizione Express che serve API e frontend;
* `source/server-side/backend/`: API, modelli Mongoose, route, middleware,
  servizi e script di seed;
* `source/navigator/`: applicazione smartphone React/TypeScript, configurazione
  museo e mappe;
* `source/editor/`: applicazione desktop Vanilla JS, componenti, pagine e stili.

Directory ed eventuali script eseguibili hanno permessi `755`; i file dei
sorgenti hanno permessi `644`. I segreti risiedono esclusivamente nel file
`.env`, non leggibile pubblicamente e non incluso in `source/`.

## Tecnologie utilizzate

#### Server-side

Node.js 22, Express 4, MongoDB, Mongoose, JWT (`jsonwebtoken`), bcryptjs,
multer, CORS, basic-auth e Swagger UI Express. Test con Jest, Supertest e
mongodb-memory-server. Deploy sui container predefiniti Node e MongoDB del
dipartimento, attivati tramite gocker.

#### Applicazione editor

HTML5, CSS3, JavaScript ES Modules senza framework SPA. Tailwind CSS compilato
localmente,
Google Fonts e API Web standard. L'Editor è servito dal processo Express
integrato e comunica con le API sulla stessa origine.

#### Applicazione navigator

React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS,
Lucide React e Web Speech API native per sintesi e riconoscimento vocale. La
build statica è servita dal processo Express integrato.

## Contributo individuale

#### Francesco Lenzini

Analisi dei requisiti e progettazione dell'architettura multi-museo; sviluppo
completo di backend Node/Express/MongoDB (modelli, API REST, autenticazione,
autorizzazione, multi-tenancy, validazione, upload, documentazione OpenAPI,
seed e test); sviluppo dell'Editor Vanilla JS e del Navigator React/TypeScript;
progettazione dei contenuti e delle visite per la Galleria degli Uffizi;
interfaccia, accessibilità, mappa multi-piano, sintesi e comandi vocali;
assemblaggio, sicurezza dei segreti, artefatto e procedura di deploy sui due
container di dipartimento.

#### Uso di LLM (strumento, non membro)

Claude (Anthropic) e OpenAI Codex (GPT-5) sono stati usati come assistenti allo
sviluppo per analisi, revisione del codice, generazione e rifinitura di parti
implementative e della documentazione. Le decisioni architetturali,
l'integrazione, la verifica e la responsabilità finale del codice e dei
contenuti restano di Francesco Lenzini.
