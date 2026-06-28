// Bootstrap dell'app: auth gate, router hash-based, montaggio shell.
import { auth, museumContext } from './api.js';
import { renderSidebar } from './components/sidebar.js';
import { renderTopbar } from './components/topbar.js';
import { spinnerBlock } from './components/ui.js';
import { toast } from './components/toast.js';
import { closeAllModals } from './components/modal.js';

const loginView = document.getElementById('login-view');
const appShell = document.getElementById('app-shell');
const viewEl = document.getElementById('view');

// Tabella delle rotte. `pattern` con segmenti :param.
const ROUTES = [
  { name: 'museums', pattern: 'museums', html: 'pages/museums.html', mod: './pages/museums.js' },
  {
    name: 'museums',
    pattern: 'museums/:id',
    html: 'pages/museum-detail.html',
    mod: './pages/museumDetail.js',
  },
  {
    name: 'content',
    pattern: 'content',
    html: 'pages/content.html',
    mod: './pages/content.js',
    needsMuseum: true,
  },
  {
    name: 'content',
    pattern: 'content/:id',
    html: 'pages/artwork-detail.html',
    mod: './pages/artworkDetail.js',
    needsMuseum: true,
  },
  {
    name: 'visits',
    pattern: 'visits',
    html: 'pages/visits.html',
    mod: './pages/visits.js',
    needsMuseum: true,
  },
  {
    name: 'visits',
    pattern: 'visits/:id',
    html: 'pages/visit-builder.html',
    mod: './pages/visitBuilder.js',
    needsMuseum: true,
  },
  { name: 'users', pattern: 'users', html: 'pages/users.html', mod: './pages/users.js', superAdmin: true },
];

// --- Bootstrap --------------------------------------------------------------

function boot() {
  if (!auth.isLoggedIn) {
    showLogin();
  } else {
    showApp();
  }
}

// --- Login ------------------------------------------------------------------

function showLogin() {
  appShell.classList.add('hidden');
  loginView.classList.remove('hidden');
  loginView.classList.add('flex');

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const submit = document.getElementById('login-submit');

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    submit.disabled = true;
    submit.textContent = 'Accesso in corso…';
    try {
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      await auth.login(username, password);
      location.hash = '#/museums';
      showApp();
    } catch (err) {
      errorEl.textContent =
        err.status === 401 ? 'Credenziali non valide.' : err.message || 'Accesso non riuscito.';
      errorEl.classList.remove('hidden');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Accedi';
    }
  };
}

// --- App shell + router -----------------------------------------------------

function showApp() {
  loginView.classList.add('hidden');
  loginView.classList.remove('flex');
  appShell.classList.remove('hidden');
  renderTopbar();
  if (!location.hash || location.hash === '#/' || location.hash === '#/login') {
    location.hash = '#/museums';
  }
  router();
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryPart || ''));
  return { segments, query };
}

function matchRoute(segments) {
  for (const route of ROUTES) {
    const parts = route.pattern.split('/');
    if (parts.length !== segments.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) params[parts[i].slice(1)] = segments[i];
      else if (parts[i] !== segments[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { route, params };
  }
  return null;
}

let currentToken = 0;

async function router() {
  if (!auth.isLoggedIn) return showLogin();

  // Chiudi eventuali modali rimaste aperte: la nuova vista parte pulita.
  closeAllModals();

  const { segments, query } = parseHash();
  const match = matchRoute(segments);

  if (!match) {
    location.hash = '#/museums';
    return;
  }

  const { route, params } = match;

  // Guard: ruolo super_admin
  if (route.superAdmin && !auth.isSuperAdmin()) {
    toast.error('Sezione riservata agli amministratori.');
    location.hash = '#/museums';
    return;
  }
  // Guard: serve un museo selezionato
  if (route.needsMuseum && !museumContext.id) {
    toast.info('Seleziona prima un museo.');
    location.hash = '#/museums';
    return;
  }

  renderSidebar(route.name);
  renderTopbar();

  const token = ++currentToken;
  viewEl.innerHTML = '';
  viewEl.appendChild(spinnerBlock());

  try {
    const [html, mod] = await Promise.all([
      fetch(route.html).then((r) => r.text()),
      import(route.mod),
    ]);
    if (token !== currentToken) return; // navigazione cambiata nel frattempo
    viewEl.innerHTML = html;
    if (mod && typeof mod.init === 'function') {
      await mod.init({ params, query, view: viewEl });
    }
  } catch (err) {
    if (token !== currentToken) return;
    viewEl.innerHTML = `<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Errore nel caricamento della pagina: ${err.message}</div>`;
  }
}

window.addEventListener('hashchange', router);
// I moduli ES sono deferred: il DOM e' gia' pronto qui, basta un boot singolo.
boot();
