// Topbar: contesto museo selezionato (con cambio rapido) + utente + logout.
import { auth, museumContext } from '../api.js';
import { escapeHtml } from './ui.js';

export function renderTopbar() {
  const el = document.getElementById('topbar');
  if (!el) return;
  const museum = museumContext.get();
  const user = auth.user;

  el.innerHTML = `
    <div class="flex items-center justify-between px-6 py-3">
      <div class="flex items-center gap-3">
        ${
          museum
            ? `<div class="flex items-center gap-2.5 rounded-lg border border-stone-200 bg-canvas px-3 py-1.5">
                 <svg class="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V9l7-5 7 5v12"/></svg>
                 <div class="leading-tight">
                   <p class="text-xs text-mute-400">Museo attivo</p>
                   <p class="text-sm font-semibold text-graphite">${escapeHtml(museum.name)}</p>
                 </div>
                 <a href="#/museums" class="ml-1 rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-light">Cambia</a>
               </div>`
            : `<a href="#/museums" class="text-sm font-medium text-mute-400 hover:text-graphite">Nessun museo selezionato — scegline uno</a>`
        }
      </div>

      <div class="flex items-center gap-3">
        <div class="text-right leading-tight">
          <p class="text-sm font-semibold text-graphite">${escapeHtml(user ? user.username : '')}</p>
          <p class="text-xs text-mute-400">${auth.isSuperAdmin() ? 'Super admin' : 'Curatore museo'}</p>
        </div>
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand-dark">
          ${escapeHtml((user && user.username ? user.username[0] : '?').toUpperCase())}
        </div>
        <button id="logout-btn" title="Esci" class="rounded-lg p-2 text-mute-400 transition hover:bg-stone-100 hover:text-red-600">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    </div>`;

  const logout = el.querySelector('#logout-btn');
  if (logout) {
    logout.addEventListener('click', () => {
      auth.logout();
      location.hash = '#/login';
      location.reload();
    });
  }
}
