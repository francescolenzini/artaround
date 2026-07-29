# Deploy sui container del dipartimento

Procedura per il sito `site252622`, pubblicato su
`https://site252622.tw.cs.unibo.it`. Segue il documento del dipartimento: si
attivano esclusivamente le immagini predefinite attraverso `gocker`; **non** si
esegue Docker Compose e non si caricano immagini personalizzate.

## Artefatto pubblicato

Il runtime Node/Express serve Navigator su `/`, Editor su `/editor` e API sulla
stessa origine. MongoDB resta nel secondo container, interno al cluster. Il
Navigator non contiene una API key: il server la inserisce nelle richieste
same-origin. La directory `source/` è separata, leggibile e senza
`node_modules`, come richiesto dalla consegna. Le dipendenze di produzione sono
invece incluse solo nel runtime `backend/node_modules/`: il server del lab ha
Node ma non npm.

## 1. Prepara l'artefatto locale

```powershell
Set-Location services/navigator/app
npm run build
Set-Location ../../..
node scripts/prepare-department-release.mjs release
```

Carica **il contenuto** di `release/` in `/home/web/site252622/html/`. Include
anche il `README.txt` di consegna. Le dipendenze runtime sono incluse nella
release, mentre `source/` resta senza `node_modules`; non caricare un `.env`
locale. La directory padre è posseduta da `root`, perciò il backup di Company
va fatto *dentro* `html`, senza tentare di rinominare `html` stessa:

```bash
cd /home/web/site252622/html
mkdir company-backup-YYYYMMDD
mv .git .gitignore index.html index.js node_modules package.json package-lock.json public README.md scripts src tpl company-backup-YYYYMMDD/
```

Non rimuovere i dati MongoDB.

## 2. Attiva MongoDB e configura i segreti

```bash
ssh gocker.cs.unibo.it
start mongo site252622
```

Annota password e username restituiti (l'username è `site252622`). L'host
interno è `mongo_site252622`; non è accessibile da Internet. Nel sito crea
`/home/web/site252622/html/.env` con permessi `600`:

```dotenv
NODE_ENV=production
PORT=8000
MONGO_URI=mongodb://site252622:PASSWORD_URL_ENCODED@mongo_site252622:27017/artaround?authSource=admin
JWT_SECRET=SEGRETO_CASUALE_LUNGO
JWT_EXPIRES_IN=8h
SWAGGER_USER=swagger
SWAGGER_PASSWORD=PASSWORD_SWAGGER_FORTE
APP_API_KEY=CHIAVE_CASUALE_64_CARATTERI_ESADECI
BOOTSTRAP_API_KEY=CHIAVE_CASUALE_64_CARATTERI_ESADECI
MUSEUM_SLUG=galleria-degli-uffizi
NAVIGATOR_EDITOR_URL=/editor
```

`APP_API_KEY` e `BOOTSTRAP_API_KEY` devono coincidere. Genera una chiave con
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
Se la password Mongo contiene caratteri riservati, codificala con
`node -p "encodeURIComponent('PASSWORD_RICEVUTA')"`.

## 3. Popola e avvia Node

```bash
cd /home/web/site252622/html
node backend/src/scripts/seed.js
find source -type d -exec chmod 755 {} \;
find source -type f -exec chmod 644 {} \;
chmod 600 .env
```

Il seed è idempotente e registra nel DB `BOOTSTRAP_API_KEY`. Non rieseguirlo
con una nuova chiave dopo l'avvio, altrimenti invaliderebbe il processo Node.

Da `gocker` avvia quindi il container definitivo:

```bash
start node-22 site252622 server.js
```

La piattaforma richiede la porta `8000`, già impostata nel file `.env`. Dopo
una modifica al runtime usa `restart site252622`; in consegna deve restare
`node-22`, non `nodemon-22`.

### Bonifica dei contenuti residui dell'account Test

Il rilascio correttivo include uno script limitato alla visita
`vis-1785351093475-45` del `museo-di-prova`. Verifica prima il riepilogo in
dry-run e usa `--apply` soltanto se riporta esattamente una visita, un'opera e
un item:

Poiche' `mongo_site252622` e' risolvibile soltanto dalla rete Docker, esegui
gli script dal prompt `gocker`, non dalla shell Lily:

```text
start node-22 site252622 backend/src/scripts/cleanup-test-data.js
logs site252622
```

Il gestore `gocker` non inoltra `--apply` allo script. Dopo un dry-run
conforme usa invece il wrapper senza argomenti:

```text
start node-22 site252622 backend/src/scripts/cleanup-test-data-apply.js
logs site252622
start node-22 site252622 server.js
```

Lo script si interrompe prima della cancellazione se metadati o relazioni non
coincidono e rimuove soltanto gli upload del grafo che non risultano referenziati
da altri contenuti.

## 4. Verifica finale

- `https://site252622.tw.cs.unibo.it/health` restituisce `{"status":"ok"}`;
- `/` mostra il Navigator e permette il login;
- `/editor` permette il login come admin/autore;
- `/docs` richiede Basic Auth e apre Swagger;
- una visita completa include player, sintesi vocale, comandi equivalenti e
  mappa multi-piano.

Per diagnosticare un avvio fallito, `gocker` indica sia `logs <site>` sia i
file sotto `/home/web/<site>/log/`. Non pubblicare mai MongoDB, `.env`, la
password Mongo o le API key.
