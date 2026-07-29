# =============================================================================
# ArtAround — immagine di PRODUZIONE (container #1: Node/Express)
# -----------------------------------------------------------------------------
# Assembla i tre submodule in un unico processo Node che serve:
#   - le API             (services/backend, "solo API", invariato)
#   - il Navigator        (services/navigator, build statica Vite)
#   - l'Editor        (services/editor, statici vanilla)
# Il container #2 è Mongo (immagine ufficiale, nessun Dockerfile custom).
#
# Context di build: la RADICE di questo repo (artaround), con i submodule
# già inizializzati (git submodule update --init --recursive).
#
# NOTA consegna dipartimento: i tecnici forniscono le immagini base (Node, Mongo)
# con versioni predefinite; le dipendenze si installano dentro quelle immagini.
# Per allinearsi, cambiare i tag `FROM` qui sotto con quelli forniti dai tecnici.
# =============================================================================

# syntax=docker/dockerfile:1

########################  Stage 1 — build del Navigator  ######################
FROM node:20-alpine AS navigator-build
WORKDIR /nav

COPY services/navigator/app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY services/navigator/app/ ./
# Vite copia public/ (museum.config.json, maps/) dentro dist/. api.config.json
# non esiste nel repo (è un segreto): lo genera server.js a runtime.
RUN npm run build


########################  Stage 2 — build dell’Editor  ########################
FROM node:20-alpine AS editor-build
WORKDIR /editor

COPY services/editor/app/package*.json ./
RUN npm ci

COPY services/editor/app/ ./
RUN npm run build:css

########################  Stage 3 — runtime Node/Express  #####################
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /srv

# --- Assembly (app/ di QUESTO repo): il solo codice che appartiene a Main ---
COPY app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY app/server.js ./

# --- Backend: solo dipendenze di produzione + sorgente (invariato) ---
# Il manifest del backend sta nella RADICE del submodule, non in app/: dentro
# app/ ci sono solo server.js, src/ e public/. Puntare ad app/package*.json fa
# sì che la COPY non trovi nulla, la cartella ./backend/ non venga creata e il
# passo successivo fallisca con "can't cd to backend".
COPY services/backend/package*.json ./backend/
RUN cd backend && (if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi)
COPY services/backend/app/ ./backend/

# --- Frontend statici serviti dal processo Node ---
RUN mkdir -p frontends/navigator frontends/editor

# Navigator: build statica dallo stage precedente
COPY --from=navigator-build /nav/dist/ ./frontends/navigator/

# Editor: solo gli asset serviti (niente serve.js/config/smoke-test/tests)
COPY services/editor/app/index.html \
     services/editor/app/app.js \
     services/editor/app/api.js \
     services/editor/app/constants.js \
     ./frontends/editor/
COPY services/editor/app/components/ ./frontends/editor/components/
COPY services/editor/app/pages/      ./frontends/editor/pages/
COPY services/editor/app/styles/     ./frontends/editor/styles/
# Regenerate the compiled Tailwind output in the image so production never
# depends on a potentially stale local generated file.
COPY --from=editor-build /editor/styles/tailwind.generated.css ./frontends/editor/styles/tailwind.generated.css

EXPOSE 3001
USER node

# server.js compone backend/src/app.js + static + iniezione x-api-key (vedi file).
CMD ["node", "server.js"]
