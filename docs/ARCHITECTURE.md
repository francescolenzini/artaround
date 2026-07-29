# Architettura as-built

ArtAround è una suite multi-museo composta da tre applicazioni collegate da
un’API REST comune. Le relazioni di dominio usano identificativi stringa
applicativi; MongoDB non è esposto direttamente ai client.

## Backend

`services/backend` usa Node.js, Express e MongoDB. Espone API REST con API key
applicativa e JWT; le autorizzazioni sono applicate lato server per ruolo e
museo. Le liste sono paginate e le risposte d’errore hanno forma uniforme.

Le entità principali sono Museum, Artwork, ArtworkItem, Visit e User. Upload,
API key, log richieste e attività sono infrastruttura applicativa. I binari
delle immagini sono conservati in MongoDB, così restano nel container dati.

## Navigator

`services/navigator` è una SPA React/TypeScript per smartphone. Al bootstrap
legge la configurazione esterna e risolve il museo tramite slug; dati
editoriali, logistica e lingue arrivano dall’API. Il player separa testo a
schermo e testo TTS, supporta comandi vocali a vocabolario controllato e offre
controlli UI equivalenti. La mappa multi-piano usa planimetrie e coordinate
statiche per museo.

## Editor

`services/editor` è una applicazione vanilla JavaScript con ES Modules e router
basato su hash. Il server di sviluppo fa da reverse proxy e inserisce la API
key lato server. Le guardie client migliorano l’esperienza utente, ma le
decisioni di sicurezza restano nel backend.

## Deploy

L’assembly di produzione in `app/server.js` monta il backend e serve Navigator
alla radice ed Editor sotto `/editor`. La configurazione del Navigator viene
scritta al boot: API same-origin, API key vuota nel browser e URL dell’Editor
configurabile tramite ambiente. Il deployment definitivo richiede due soli
container del dipartimento: Node/Express e MongoDB.

Per la topologia visiva vedi `architecture.puml`; per comandi e variabili vedi
il README principale.
