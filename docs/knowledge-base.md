# ArtAround — Knowledge Base

> Documento pensato per essere caricato nella **knowledge base di un Claude Project** (claude.ai), per poter fare domande di implementazione senza dover riaprire Claude Code o ricaricare il PDF delle specifiche ogni volta. Va caricato insieme a [`ARCHITECTURE.md`](ARCHITECTURE.md) (dettaglio tecnico del backend) e, idealmente, a `architecture.puml`.
>
> Fonti: `docs/25 Progetto 2526.pdf` (slide del docente, A.A. 2025/26), `docs/faqmd.md` (FAQ del docente), `docs/ReadmeTemplate2526-18-33.txt` (template di consegna), esplorazione del codice in `backend/` e `frontend/`.

---

## 1. Cos'è ArtAround

Progetto del corso di **Tecnologie Web** (CdS Informatica, UniBO, A.A. 2025/26, docenti Fabio Vitali, Andrea Schimmenti, Gianmarco Spinaci, Remo Grillo). Idea: *"visitare musei in maniera personalizzata e divertente"*.

Principio guida esplicito del docente: **Goal-Oriented Design** — un'unica applicazione generica (non legata a un museo specifico) che si adatta all'utente lungo quattro dimensioni, senza creare contenuti o applicazioni diverse, solo **modi diversi di presentare gli stessi contenuti**:

1. **Interessi specifici** (storia, abbigliamento/architettura raffigurati, colori/layout, materiali/pigmenti, eventi storici...)
2. **Competenze di background** (visitatore casuale, appassionato, esperto del contesto culturale)
3. **Contesto della visita** (prima volta o ricorrente, vuole vedere tutto o solo highlights, tempo disponibile)
4. **Età e maturità** (scolaresca, universitari per tesi/ricerca, pensionati, lavoratori con poche ore)

### Scenario d'uso
L'utente usa lo smartphone per muoversi fisicamente nello spazio espositivo (la visita è **sempre in presenza**) e ascolta in cuffia spiegazioni testuali rese in TTS; le eventuali immagini servono solo a riconoscere l'oggetto descritto, non a sostituire la visita fisica.

### Due fasi/applicazioni
- **Prima della visita** → *editor + marketplace*: preparare, vendere, trovare e selezionare contenuti, comporre una sequenza per una visita specifica.
- **Durante la visita** → *navigator*: essere guidati da un oggetto all'altro, ascoltare descrizioni di linguaggio variabile, fare domande sull'oggetto e su argomenti correlati (stile, epoca, biografia dell'artista...).

**Criterio di successo UX**: capacità del navigator di parlare a ogni utente secondo le sue esigenze. **Criterio di successo di mercato**: la stessa applicazione deve adattarsi a musei diversi cambiando solo immagini e file di configurazione.

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
| Visit | `Visit` | `steps[]` = sequenza di item + logistica |
| Indicazioni logistiche tra item | `VisitStep.directionsFromPrevious` | Step di tipo `transition`/`logistics_intro` per le indicazioni non legate a un item specifico |
| Item su contenuti associati (stili, artisti, eventi) | **Non modellato** | `Artwork` rappresenta solo oggetti fisici del museo; non c'è un'entità per "contenuto associato" non legato a un oggetto specifico — **gap aperto** |

In sintesi: il cuore del modello dati è già coerente con le specifiche. Il gap principale è che il modello attuale assume sempre un `Artwork` come ancora di un item, mentre le specifiche permettono item "liberi" su argomenti correlati.

---

## 3. Vincoli tecnologici hard (non negoziabili)

Dalle slide "Vincoli hard" — violarli rischia la non accettabilità del progetto:

- **Backend**: Node.js + MongoDB + Express + vanilla JavaScript o TypeScript, moduli npm liberi. **Vietati**: PHP, Perl, Python, Java, Ruby, MySQL e qualunque tecnologia server-side fuori dall'ecosistema Node. **Vietato anche Deno.**
- **ArtAround Navigator**: client-side JS/TS, **con un framework a scelta** tra Angular, React, Vue, Svelte (o equivalenti).
- **ArtAround Marketplace/Editor**: client-side JS/TS, **senza framework SPA** — vanilla JS, ok Web Components, Alpine o HTMX.
- **Grafica**: libreria libera (Bootstrap, Tailwind, Foundation, ecc.) ma si valuta esplicitamente sofisticazione grafica, facilità d'uso ed eleganza.
- **Deploy obbligatorio** su **due container Docker** delle macchine del dipartimento — nessuna eccezione. Tutto il codice e tutti i dati risiedono lì. La scelta delle API (terze parti, LLM, mappe, ecc.) è libera.
- **Entrambe le app sono generiche**, non legate a un museo specifico:
  - Il **Navigator** può essere personalizzato per un singolo museo tramite **file di configurazione** (immagini, titoli) — non va costruita un'interfaccia per crearlo, si dà per scontato che esista già (JSON generico per il caso multi-museo, più strutturato per il caso mono-museo).
  - Il **Marketplace non ha versioni specifiche per museo**.

Questi vincoli sono scritti **in verde** nelle slide originali (vincoli specifici per le esigenze del progetto universitario, non necessariamente opportuni in un prodotto di mercato reale).

---

## 4. Livelli di progetto: 18-24 / 18-27 / 18-33

Il voto del progetto va da 18 a 24/27/33 in trentesimi (poi mediato 50/50 con lo scritto). Il gruppo sceglie il livello a cui puntare.

### Base (18-24) — tutto ciò che è "nero" nelle slide, sempre obbligatorio
Struttura base del Navigator:
- Accesso al marketplace
- Selezione ed esecuzione di una visita
- Visualizzazione su mappa degli oggetti (**senza** posizionamento dell'utente)
- Sintesi vocale + visualizzazione a schermo del contenuto dell'item selezionato
- **Comandi vocali su vocabolario controllato**: prossimo/precedente; "cos'è questo"/"dimmi di più"/"dimmi di meno"; "non capisco"/"troppo semplice"; chi è l'autore/qual è lo stile; dov'è uscita/toilette/bar/shop/ostacoli; ecc.
- **UI accessibile a bottoni**, equivalente ai comandi vocali (per chi non usa la voce)

Marketplace/Editor base: selezione museo da pannello, visualizzazione contenuti esistenti (gratuiti/a pagamento) con gestione della scala, editing visita, creazione contenuti (id universale, immagine, testi multipli, metadati), pubblicazione (licenza, prezzo, adozioni, vendite).

**Vincoli**: 18-24 è individuale o gruppi di 2 persone.

### Estensione 18-27 — "arancione", visite sincronizzate (insegnante/guida)
Pensata per una docente che trasmette contenuti sincronizzati a tutti gli studenti contemporaneamente e ne controlla l'attenzione:
- La docente prepara sul marketplace una visita personalizzata/sincronizzata, anche con contenuti privati non pubblici, e le assegna un **nome mnemonico** (es. "Fenice rossa"); può preparare domande a risposta multipla.
- All'inizio, la docente attiva la visita; gli studenti la raggiungono digitando il nome; la docente vede chi si è collegato.
- Davanti a ogni opera la docente avvia la descrizione corretta; lo studente può chiedere approfondimenti/registro diverso ma **non può andare avanti/indietro autonomamente**.
- La docente monitora in tempo reale chi ha chiesto cosa.
- A fine visita può avviare un quiz e assegnare un voto.
- **Requisito di consegna per questa estensione**: almeno una visita creata per fruizione sincronizzata, con un test sensato di competenza a fine visita.
- **Vincoli**: gruppi di 1-2-3 persone.

### Estensione 18-33 — "arancione", geolocalizzazione + LLM generativa
**Localizzazione**, con due scopi: capire qual è l'oggetto "prossimo" e preparare i contenuti relativi; generare/caricare le indicazioni logistiche (percorso, ostacoli, luoghi rilevanti).
- *Versione base*: QR code accanto a ogni opera, scansionato dal Navigator.
- *Versione avanzata*: geolocalizzazione + orientamento del device; se incerta, mostra immagini a bassa risoluzione tra cui l'utente sceglie.

**Integrazione LLM**, con **quattro** scopi precisi e *solo* questi:
1. Creare item per oggetti non descritti, o con livello/linguaggio mancante, o item alternativi.
2. Accettare comandi vocali **in linguaggio naturale libero**, oltre al vocabolario controllato, mappandoli sui comandi disponibili (es. "e adesso?" → "prossimo").
3. **Traduzione in tempo reale** di contenuti e comandi vocali nella lingua scelta dall'utente (stessi contenuti, lingue diverse).
4. **Generazione di visite su misura** dai vincoli dell'utente in linguaggio naturale (es. "ho solo mezz'ora", "stupiscici con dettagli insoliti", "due bambini di 5 e 8 anni", "tesi sul Parmigianino e Bedoli").

Vincolo esplicito e importante: **l'utente non deve mai accorgersi di interagire con un LLM** — nessuna UI a prompt, solo form e interazione diretta; non deve essere possibile distinguere contenuti umani da contenuti AI se non analizzando i metadati.

**Requisiti di consegna per questa estensione**: QR code stampabili su carta per simulare la presenza fisica vicino a un oggetto; un modulo di "teletrasporto" che porta a una posizione prestabilita vicino a ciascun oggetto della visita (utile per demo/test senza muoversi fisicamente).

**Vincoli**: gruppi di 2-3 persone, presentazione **di persona su appuntamento** (non in pre-valutazione come 18-24/18-27).

---

## 5. Stato di avanzamento del repository e gap aperti

> Verificato esplorando `backend/src/**`, `backend/tests/**`, `frontend/*.ts` il 2026-06-21. Va riconfermato a ogni ripresa del lavoro, perché questo file non si aggiorna da solo.

### Cosa esiste ed è solido
- Backend Express/Mongoose completo: 6 entità di dominio + 2 infrastrutturali, auth dual-layer (API key + JWT), RBAC `super_admin`/`museum_curator`, multi-tenancy single-DB, paginazione server-side centralizzata, logging richieste con masking, Swagger protetto da Basic Auth, suite di test (unit + integration) con mongodb-memory-server, script seed e CLI api-key.
- Il modello dati centrale (Visit/Artwork/ArtworkItem) è già coerente con il modello "Visit + Item" richiesto (vedi sezione 2).

### Gap rispetto alle specifiche — da affrontare prima della consegna

1. **Nessuna delle due app frontend è stata avviata.** `frontend/` contiene solo `index.ts` (tipi) e `mockData.ts` (dataset mock); mancano sia il Navigator (framework JS/TS) sia il Marketplace/Editor (vanilla JS/TS). Questo è il gap più grande e l'elemento valutato esplicitamente su usabilità/sofisticazione grafica.
2. **Dati di seed molto sotto i minimi di consegna.** Le specifiche richiedono: un museo reale popolato con contenuti, **3 visite di almeno 10 opere ciascuna sullo stesso museo**, differenziate per contenuti/livello; account marketplace `autore1`, `autore2`, `visitatore1`, `visitatore2` con password `12345678` (altri account a piacere, stessa password). Il `seed.js` attuale crea 2 musei, 3 utenti (`arossi`/`mbianchi`/`lverdi`, password `ChangeMe123!`), 2 artwork, 2 item, **1 visita con 1 solo step**. `frontend/mockData.ts` ha un dataset più ricco (4 musei, 7 opere, 12 item, 5 visite) ma comunque non allineato ai requisiti esatti di naming/quantità della consegna, e comunque non è quello realmente caricato a DB.
3. **Ruoli utente non coprono i ruoli "marketplace".** Il modello `User` ha solo `super_admin`/`museum_curator` (pensati per la gestione amministrativa multi-museo); le specifiche parlano di account "autore" (crea/pubblica contenuti) e "visitatore" (acquista/fruisce contenuti) — concetti di ruolo diversi, non ancora rappresentati nello schema né nelle rotte.
4. **Estensione 18-27 non iniziata**: nessuna nozione di visita "sincronizzata", nome mnemonico, attivazione guidata, monitoraggio in tempo reale, quiz finale.
5. **Estensione 18-33 non iniziata**: nessuna geolocalizzazione/QR, nessuna integrazione LLM (generazione item, routing comandi naturali, traduzione, generazione visite custom), nessun modulo di teletrasporto.
6. **`README.txt` di consegna non ancora creato.** È un file **diverso** dal `README.md` del repo: deve seguire il template in `docs/ReadmeTemplate2526-18-33.txt`, contiene le "promesse non ritrattabili" del progetto, va scritto al momento della sottomissione su Virtuale e **non può più essere modificato** dopo. Non è in scope per il task di documentazione corrente — va pianificato come attività separata vicino alla consegna.
7. **Deploy sui container del dipartimento non ancora impostato.** Esiste solo `backend/docker/docker-compose.yml` per sviluppo locale; il deploy finale richiesto (2 container del dipartimento, sia codice sia dati) è un passo separato, da pianificare con anticipo (vedi FAQ: serve usare le immagini Docker fornite dai tecnici, non immagini custom).
8. **Funzionalità "extra" rispetto alle specifiche**: API-key auth, RBAC `super_admin`/`museum_curator`, request logging centralizzato con masking non sono richieste esplicitamente dal docente. Non sono in conflitto con le specifiche (la scelta delle API è libera) ma vanno tenute a mente in fase di presentazione: il valore percepito dal docente è su generalità/flessibilità/usabilità del **prodotto finale per il visitatore/curatore**, non sulla sofisticazione dell'infrastruttura backend.

---

## 6. Requisiti di consegna (checklist)

Dalla sezione "Requisiti di progetto" e "La consegna" delle slide:

- [ ] Database già popolato al momento della presentazione, con un **museo reale** (es. Pinacoteca Nazionale, MAMbo, Musei Universitari) e contenuti non superficiali (uso di LLM per generarli è permesso, ma non "quattro testi svogliati")
- [ ] Account marketplace: `autore1`, `autore2`, `visitatore1`, `visitatore2` — password `12345678` per tutti (altri account liberi, stessa password)
- [ ] Almeno **3 visite** sullo stesso museo, **≥10 opere ciascuna**, differenziate per contenuti/livello di conoscenza
- [ ] (Se 18-27) almeno una visita per fruizione sincronizzata, con test di competenza sensato a fine visita
- [ ] (Se 18-33) QR code su carta per simulare presenza fisica + modulo di teletrasporto verso ciascun oggetto della visita
- [ ] Deploy su **due container Docker del dipartimento** (codice + dati)
- [ ] Directory `sources` con **tutti** i sorgenti leggibili (permessi 755 per directory/eseguibili, 644 per file), **senza** `node_modules`
- [ ] File `README.txt` (non `.md`) dal template fornito, completo di: nome gruppo, membri (nome/cognome/matricola/email), tipo progetto e locazione file/docker, organizzazione sorgenti, tecnologie usate per ciascuna applicazione (server-side, marketplace, navigator), contributo individuale dettagliato, contributo della LLM se usata
- [ ] `README.txt` sottomesso su Virtuale **prima** della data di valutazione e mai più modificato dopo

### Vincoli su gruppo e contributo individuale
- Gruppi di **2-3 persone** (18-24 anche individuale o 2 persone); nessun gruppo oltre 3 persone per nessun motivo.
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
- **Da dove iniziare**: il docente consiglia di partire dal **marketplace**, con un'interfaccia e-commerce classica a tabella, poi migliorare iterativamente.
- **Geolocalizzazione**: non serve precisione al centimetro — la precisione GPS civile (≤5m) basta per indicare gli oggetti vicini; l'**orientamento** del device è invece abbastanza affidabile e utile (es. "l'utente sta andando verso est").
- **File di configurazione**: esistono due livelli — uno generico riusabile per qualunque museo, uno specifico e strutturato per un singolo museo (immagine di copertina, contenuti, cartina...). **Non va costruita un'interfaccia per crearlo**: si dà per scontato che esista già (es. scritto a mano o generato offline).
- **Costo chiamate LLM**: cercare opzioni economiche/gratuite (es. risorse tipo `free-llm-api-resources` su GitHub).

---

## 9. Scadenze rilevanti A.A. 2025/26

- Appelli scritto: 16 gen 2026 (regole anni passati), **28 gen 2026**, 12 feb 2026 (da confermare), 28 mag 2026, 23 giu 2026, 13 lug 2026, 16 set 2026. Posti limitati (45) per appello, prenotazione necessaria.
- **30 settembre 2026**: ultima data per presentare il progetto dell'anno corrente (eventuali richieste motivate dell'ultimo minuto gestite a ottobre, a discrezione del docente).
- **31 luglio 2026**: scadenza per sottomettere `README.txt` su Virtuale e richiedere uno slot per l'appello di settembre — nessuna richiesta accettata dopo questa data.
- Scritto e progetto sono prove **indipendenti**: si può fare prima l'uno o l'altro; lo scritto è individuale, il progetto è di gruppo; il progetto si può ripresentare quante volte serve se tutto il gruppo è d'accordo.
