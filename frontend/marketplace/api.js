// Client HTTP unico per il backend ArtAround.
//
// Tutte le chiamate passano dallo stesso dev server (singola origine): la
// `x-api-key` viene iniettata dal proxy in serve.js, quindi qui inviamo solo
// `Authorization: Bearer <jwt>`. Errori e 401 sono gestiti in modo uniforme.

const TOKEN_KEY = 'artaround.token';
const USER_KEY = 'artaround.user';
const MUSEUM_KEY = 'artaround.selectedMuseum';

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// --- Stato di autenticazione (localStorage) ---------------------------------

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get user() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  get isLoggedIn() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
  isSuperAdmin() {
    const u = this.user;
    return Boolean(u && u.role === 'super_admin');
  },
  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MUSEUM_KEY);
  },
  async login(username, password) {
    const res = await rawRequest('POST', '/auth/login', {
      body: { username, password },
      skipAuthRedirect: true,
    });
    // Il Marketplace/Editor è per admin e autori. I visitatori fruiscono i
    // contenuti dall'app Navigator: qui non avrebbero nulla da editare.
    if (res.user && res.user.role === 'visitor') {
      throw new ApiError(
        403,
        'I visitatori usano l\'app Navigator durante la visita, non il Marketplace.'
      );
    }
    this.setSession(res.token, res.user);
    return res.user;
  },
  logout() {
    // Il backend non espone /auth/logout (JWT stateless): logout = clear locale.
    this.clear();
  },
};

// --- Museo selezionato (contesto globale) -----------------------------------

export const museumContext = {
  get() {
    const raw = localStorage.getItem(MUSEUM_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set(museum) {
    localStorage.setItem(
      MUSEUM_KEY,
      JSON.stringify({ id: museum.id, name: museum.name, shortName: museum.shortName })
    );
  },
  get id() {
    const m = this.get();
    return m ? m.id : null;
  },
  clear() {
    localStorage.removeItem(MUSEUM_KEY);
  },
};

// --- Core request -----------------------------------------------------------

function buildQuery(query) {
  if (!query) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    usp.append(key, value);
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

async function rawRequest(method, path, { query, body, skipAuthRedirect } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(path + buildQuery(query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(0, `Rete non raggiungibile: ${networkErr.message}`);
  }

  // 401 -> sessione scaduta/non valida. Pulisci e torna al login.
  if (response.status === 401 && !skipAuthRedirect) {
    auth.clear();
    if (!location.hash.startsWith('#/login')) {
      location.hash = '#/login';
      location.reload();
    }
    throw new ApiError(401, 'Sessione scaduta, effettua di nuovo il login.');
  }

  if (response.status === 204) return null;

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      (payload && payload.error && payload.error.message) ||
      (typeof payload === 'string' && payload) ||
      `Errore ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload;
}

// Helper generico per una risorsa REST paginata.
function resource(basePath) {
  return {
    list: (query) => rawRequest('GET', basePath, { query }),
    get: (id) => rawRequest('GET', `${basePath}/${id}`),
    create: (body) => rawRequest('POST', basePath, { body }),
    update: (id, body) => rawRequest('PUT', `${basePath}/${id}`, { body }),
    remove: (id) => rawRequest('DELETE', `${basePath}/${id}`),
  };
}

export const museums = resource('/museums');
export const artworks = resource('/artworks');
export const items = resource('/artwork-items');
export const visits = resource('/visits');
export const activities = {
  list: (query) => rawRequest('GET', '/activities', { query }),
  create: (body) => rawRequest('POST', '/activities', { body }),
};

// Gli utenti si modificano con PATCH (non PUT) e non hanno DELETE.
export const users = {
  list: (query) => rawRequest('GET', '/users', { query }),
  create: (body) => rawRequest('POST', '/users', { body }),
  update: (id, body) => rawRequest('PATCH', `/users/${id}`, { body }),
};

export const api = { auth, museumContext, museums, artworks, items, visits, activities, users };
export default api;
